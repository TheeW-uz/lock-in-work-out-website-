import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/admin-token';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('lockin_admin_session')?.value;
    const adminSession = verifyAdminToken(token);

    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = getSupabaseAdmin();
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Total Users
    const { count: totalUsers, error: err1 } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 2. Active Users (non-frozen profiles)
    const { count: activeUsers, error: err2 } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_frozen', false);

    // 3. Frozen Accounts
    const { count: frozenUsers, error: err3 } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_frozen', true);

    // 4. Banned Users
    const { data: bansData, error: err4 } = await adminClient
      .from('bans')
      .select('user_id, banned_until');
    
    // Filter active bans
    const now = new Date();
    const activeBans = bansData 
      ? bansData.filter(b => !b.banned_until || new Date(b.banned_until) > now)
      : [];
    const bannedUsersCount = new Set(activeBans.map(b => b.user_id)).size;

    // 5. Workouts Completed Today
    const { count: workoutsCompletedToday, error: err5 } = await adminClient
      .from('daily_workouts')
      .select('*', { count: 'exact', head: true })
      .eq('date', todayStr)
      .in('status', ['completed', 'partial']);

    // 6. Points Awarded Today
    const { data: pointsTodayData, error: err6 } = await adminClient
      .from('points_history')
      .select('points')
      .eq('date', todayStr);
    
    const pointsAwardedToday = pointsTodayData
      ? pointsTodayData.reduce((sum, p) => sum + p.points, 0)
      : 0;

    // 7. Recent Registrations (last 5)
    const { data: recentRegistrations, error: err7 } = await adminClient
      .from('profiles')
      .select('id, username, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // 8. Recent Admin Actions (last 5)
    const { data: recentAdminActions, error: err8 } = await adminClient
      .from('admin_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (err1 || err2 || err3 || err5) {
      console.error('Stats query error:', { err1, err2, err3, err5 });
    }

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        bannedUsers: bannedUsersCount,
        frozenAccounts: frozenUsers || 0,
        workoutsCompletedToday: workoutsCompletedToday || 0,
        pointsAwardedToday: pointsAwardedToday,
      },
      recentRegistrations: recentRegistrations || [],
      recentAdminActions: recentAdminActions || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
