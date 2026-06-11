import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signAdminToken } from '@/lib/admin-token';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username === 'admin' && password === 'abubakr9889') {
      const token = signAdminToken(username);
      const cookieStore = await cookies();
      
      cookieStore.set('lockin_admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid admin username or password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
