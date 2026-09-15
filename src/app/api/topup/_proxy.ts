import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Thin proxy to the backend's topup endpoints (`/api/v1/topup/...`).
 *
 * The "Topup hộ khách" dialog called `/api/topup/packages` and
 * `/api/topup/admin/manual`, but no such route existed in the CMS, so every
 * call hit Next's own 404 page and the dialog could only say "API error: 404"
 * (#012). The backend enforces auth (and the admin role on `admin/manual`)
 * itself; this adds no access control of its own.
 */
export async function proxyTopup(request: NextRequest, path: string, init?: RequestInit) {
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${API_URL}/api/v1/topup${path}${request.nextUrl.search}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    cache: 'no-store'
  });

  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    // A non-JSON reply (gateway error page, crash) must still reach the dialog
    // as a readable error rather than blowing up the route with a 500.
    data = null;
  }

  if (!res.ok) {
    return NextResponse.json(
      {
        message: (data?.message as string | undefined) || `Request failed (${res.status})`,
        errors: data?.errors
      },
      { status: res.status }
    );
  }
  return data === null ? new NextResponse(null, { status: res.status }) : NextResponse.json(data);
}
