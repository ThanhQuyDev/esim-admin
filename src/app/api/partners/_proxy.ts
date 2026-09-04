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
 * Thin proxy to the backend's admin-partners endpoints
 * (`/api/v1/admin/partners/...`). All partner-management pages in the admin
 * dashboard go through this — the backend enforces `@Roles(admin)` itself, so
 * this proxy adds no additional access control of its own.
 */
export async function proxyAdminPartners(request: NextRequest, path: string, init?: RequestInit) {
  const headers = await authHeaders();
  const search = request.nextUrl.search;
  const res = await fetch(`${API_URL}/api/v1/admin/partners${path}${search}`, {
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
