import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** Struck-out price on plans without a discount (vande-2011 #012). */
async function forward(method: 'GET' | 'PUT', body?: unknown) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const res = await fetch(`${API_URL}/api/v1/profit-margins/price-display`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: 'no-store'
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET() {
  return forward('GET');
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return forward('PUT', { autoStrikePercent: Number(body?.autoStrikePercent) });
}
