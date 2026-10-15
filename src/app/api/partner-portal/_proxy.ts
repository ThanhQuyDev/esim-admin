import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { PARTNER_LOCKED_MESSAGE } from '@/config/partner-session';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function authHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

/**
 * The backend no longer honours this partner's token: an admin locked the
 * account, or signed it out everywhere (doitac-1410 #004). The cookie is
 * dropped here, since only the server can clear an httpOnly cookie and until
 * it is gone the sign-in page would bounce the partner straight back in.
 * `errors.session` is what tells the browser to go to the sign-in page.
 */
function sessionEnded(message?: string) {
  const locked = message === PARTNER_LOCKED_MESSAGE;
  const response = NextResponse.json(
    {
      message: locked ? message : 'Phiên đăng nhập đã kết thúc, vui lòng đăng nhập lại.',
      errors: { session: locked ? 'locked' : 'ended' }
    },
    { status: 401 }
  );
  response.cookies.delete('token');
  response.cookies.delete('refreshToken');
  return response;
}

/**
 * Thin proxy to the backend's self-service partner endpoints
 * (`/api/v1/partners/...`) — distinct from `/api/partners/*` in this app,
 * which proxies the admin-only `/api/v1/admin/partners/...` endpoints. The
 * backend enforces `@Roles(partner, admin)` (or no auth for `apply`) itself.
 */
export async function proxyPartnerPortal(request: NextRequest, path: string, init?: RequestInit) {
  const headers = await authHeaders();
  const search = request.nextUrl.search;
  const res = await fetch(`${API_URL}/api/v1/partners${path}${search}`, {
    headers,
    ...init
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (res.status === 401 && 'Authorization' in headers) {
    return sessionEnded(data?.message);
  }

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message || 'Request failed', errors: data?.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
