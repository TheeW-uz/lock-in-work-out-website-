import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/admin-token';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('lockin_admin_session')?.value;
    const adminSession = verifyAdminToken(token);

    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const adminClient = getSupabaseAdmin();
    
    let query = adminClient
      .from('profiles')
      .select(`
        *,
        leaderboard_stats (*),
        bans (*),
        account_freezes (*)
      `);
      
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch administrative audit logs
    const { data: auditLogs, error: auditError } = await adminClient
      .from('admin_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    return NextResponse.json({ users, auditLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
