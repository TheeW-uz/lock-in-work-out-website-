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

    const { data: reports, error } = await adminClient
      .from('reports')
      .select(`
        *,
        user:profiles(username, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Reports GET] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports: reports ?? [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('lockin_admin_session')?.value;
    const adminSession = verifyAdminToken(token);

    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, status, adminNotes } = await request.json();

    if (!reportId || !status) {
      return NextResponse.json({ error: 'Missing reportId or status' }, { status: 400 });
    }

    const adminClient = getSupabaseAdmin();

    const { data, error } = await adminClient
      .from('reports')
      .update({
        status,
        admin_notes: adminNotes || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select();

    if (error) {
      console.error('[Admin Reports PATCH] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log admin action
    await adminClient.from('admin_actions').insert({
      admin_username: adminSession.username,
      action_type: 'resolve_report',
      target_user_id: '00000000-0000-0000-0000-000000000000',
      details: `Resolved ticket (${reportId}) as ${status}. Notes: ${adminNotes || 'none'}`
    });

    return NextResponse.json({ success: true, report: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
