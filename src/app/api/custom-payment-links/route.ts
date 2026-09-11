import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Saved payment-order history (#084). The CMS list screen called this path but
 * no proxy existed, so the page loaded empty behind a 404.
 */
export async function GET(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${API_URL}/api/v1/custom-payment-links${request.nextUrl.search}`, {
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
