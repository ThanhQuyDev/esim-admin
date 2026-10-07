import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { resolveAppMode } from '@/config/app-mode';
import { ADMIN_CONSOLE_ROLES } from '@/config/role-access';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${API_URL}/api/v1/auth/email/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    // `errors` carries the reason code (e.g. partnerPending, #001) that the
    // sign-in page turns into its own notice instead of a generic toast.
    return NextResponse.json(
      { message: data.message || 'Login failed', errors: data.errors },
      { status: res.status }
    );
  }

  // A storefront customer's password signs in to the same API, but the admin
  // console is for admins and authors only (#011) — no session is created.
  const roleId = Number(data.user?.role?.id);
  if (
    resolveAppMode(req.headers.get('host')) === 'admin' &&
    !ADMIN_CONSOLE_ROLES.includes(roleId)
  ) {
    return NextResponse.json(
      {
        message: 'Tài khoản này không có quyền truy cập trang quản trị.',
        errors: { email: 'roleNotAllowed' }
      },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();

  cookieStore.set('token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor((data.tokenExpires - Date.now()) / 1000)
  });

  cookieStore.set('refreshToken', data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60
  });

  return NextResponse.json(data);
}
