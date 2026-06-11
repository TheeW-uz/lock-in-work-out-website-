import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/admin-token';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('lockin_admin_session')?.value;
    const adminSession = verifyAdminToken(token);

    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, userId, data } = body;
    const adminClient = getSupabaseAdmin();

    // 1. Audit Log Helper
    const logAdminAction = async (type: string, targetId: string, details: string) => {
      await adminClient.from('admin_actions').insert({
        admin_username: adminSession.username,
        action_type: type,
        target_user_id: targetId,
        details: details
      });
    };

    if (action === 'change_username') {
      const { newUsername } = data;
      if (!newUsername || newUsername.trim() === '') {
        return NextResponse.json({ error: 'Username cannot be empty' }, { status: 400 });
      }

      // Update in profiles table
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      // Update in auth.users user_metadata
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { username: newUsername }
      });

      await logAdminAction('change_username', userId, `Changed username to: ${newUsername}`);
      return NextResponse.json({ success: true });
    }

    else if (action === 'reset_password') {
      const { newPassword } = data;
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 500 });
      }

      await logAdminAction('reset_password', userId, `Reset password successfully`);
      return NextResponse.json({ success: true });
    }

    else if (action === 'adjust_points') {
      const { points, description } = data;
      const ptsInt = parseInt(points);
      if (isNaN(ptsInt)) {
        return NextResponse.json({ error: 'Points must be a valid integer' }, { status: 400 });
      }

      const { error: historyError } = await adminClient
        .from('points_history')
        .insert({
          user_id: userId,
          points: ptsInt,
          description: description || 'Admin adjustment',
          category: 'admin_adjustment'
        });

      if (historyError) {
        return NextResponse.json({ error: historyError.message }, { status: 500 });
      }

      await logAdminAction('adjust_points', userId, `Adjusted points by ${ptsInt >= 0 ? '+' : ''}${ptsInt}. Reason: ${description}`);
      return NextResponse.json({ success: true });
    }

    else if (action === 'freeze_user') {
      const { reason } = data;
      
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({ is_frozen: true })
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      await adminClient
        .from('account_freezes')
        .insert({ user_id: userId, reason: reason || 'No reason provided' });

      await logAdminAction('freeze_user', userId, `Frozen account. Reason: ${reason}`);
      return NextResponse.json({ success: true });
    }

    else if (action === 'unfreeze_user') {
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({ is_frozen: false })
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      await adminClient
        .from('account_freezes')
        .delete()
        .eq('user_id', userId);

      await logAdminAction('unfreeze_user', userId, `Unfroze account`);
      return NextResponse.json({ success: true });
    }

    else if (action === 'ban_user') {
      const { reason, bannedUntil } = data;
      
      // Insert into bans
      const { error: banError } = await adminClient
        .from('bans')
        .insert({
          user_id: userId,
          reason: reason || 'No reason provided',
          banned_until: bannedUntil ? new Date(bannedUntil).toISOString() : null
        });

      if (banError) {
        return NextResponse.json({ error: banError.message }, { status: 500 });
      }

      await logAdminAction('ban_user', userId, `Banned user until ${bannedUntil || 'permanently'}. Reason: ${reason}`);
      return NextResponse.json({ success: true });
    }

    else if (action === 'unban_user') {
      const { error: banError } = await adminClient
        .from('bans')
        .delete()
        .eq('user_id', userId);

      if (banError) {
        return NextResponse.json({ error: banError.message }, { status: 500 });
      }

      await logAdminAction('unban_user', userId, `Unbanned user`);
      return NextResponse.json({ success: true });
    }

    else if (action === 'delete_user') {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      await logAdminAction('delete_user', userId, `Deleted user account permanently`);
      return NextResponse.json({ success: true });
    }

    else if (action === 'get_user_history') {
      // Get points history
      const { data: points, error: ptsErr } = await adminClient
        .from('points_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Get workout history
      const { data: workouts, error: workErr } = await adminClient
        .from('daily_workouts')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      // Get weekly plans
      const { data: weeklyPlans, error: plansErr } = await adminClient
        .from('weekly_plans')
        .select('*')
        .eq('user_id', userId);

      if (ptsErr || workErr || plansErr) {
        return NextResponse.json({ error: ptsErr?.message || workErr?.message || plansErr?.message }, { status: 500 });
      }

      return NextResponse.json({ points, workouts, weeklyPlans });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
