import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Thin proxy to the backend's `/api/v1/admin/customer-announcements`
 * (vande #072). The backend enforces `@Roles(admin)` itself.
 */
export async function proxyCustomerAnnouncements(path: string, init?: RequestInit) {
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${API_URL}/api/v1/admin/customer-announcements${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    return NextResponse.json(
      { message: message || 'Request failed', errors: data?.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: res.status });
}
