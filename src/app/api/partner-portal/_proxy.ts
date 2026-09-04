import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message || 'Request failed', errors: data?.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
