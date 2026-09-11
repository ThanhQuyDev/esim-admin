import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Thin proxy to the backend's provider-deposit endpoints
 * (`/api/v1/provider-deposits/...`). The deposit screen called these paths but
 * no proxy existed, so it loaded empty behind 404s. The backend enforces
 * `@Roles(admin)` itself; this adds no access control of its own.
 */
export async function proxyProviderDeposits(
  request: NextRequest,
  path: string,
  init?: RequestInit
) {
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${API_URL}/api/v1/provider-deposits${path}${request.nextUrl.search}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message || 'Request failed', errors: data?.errors },
      { status: res.status }
    );
  }
  return data === null ? new NextResponse(null, { status: res.status }) : NextResponse.json(data);
}
