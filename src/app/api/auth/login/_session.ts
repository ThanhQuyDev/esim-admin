import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { resolveAppMode } from '@/config/app-mode';
import { ADMIN_CONSOLE_ROLES, consoleRoleId } from '@/config/role-access';

export const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * What the backend answered to a sign-in — the password step, or the code
 * step of a two-step sign-in (vande-1411 #005) — turned into this app's
 * session cookies, or into the refusal the sign-in page shows.
 */
export async function finishSignIn(
  req: NextRequest,
  res: Response,
  fallback: string
): Promise<NextResponse> {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // `errors` carries the reason code (e.g. partnerPending, #001) that the
    // sign-in page turns into its own notice instead of a generic toast.
    return NextResponse.json(
      { message: data.message || fallback, errors: data.errors },
      { status: res.status }
    );
  }

  // Two-step sign-in on (vande-1411 #005): a code went by email, there is
  // no session yet. The page asks for the code and sends it with the challenge.
  if (data.twoFactorRequired) {
    return NextResponse.json({
      twoFactorRequired: true,
      challenge: data.challenge,
      sentTo: data.sentTo,
      expiresInMinutes: data.expiresInMinutes
    });
  }

  // A storefront customer's password signs in to the same API, but the admin
  // console is for admins and authors only (#011) — no session is created.
  // An extra "Tác giả" role opens the console too (vande #071).
  const roleId = Number(consoleRoleId(data.user?.role?.id, data.user?.extraRoleIds));
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
