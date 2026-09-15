import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Thin proxy to the backend's `/api/v1/admin/membership-tiers` endpoints (#024).
 * The backend enforces `@Roles(admin)` itself.
 */
export async function proxyAdminMembershipTiers(path: string, init?: RequestInit) {
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${API_URL}/api/v1/admin/membership-tiers${path}`, {
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

  return NextResponse.json(data);
}
