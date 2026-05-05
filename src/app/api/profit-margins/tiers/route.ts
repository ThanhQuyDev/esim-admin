import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function GET(request: NextRequest) {
  const headers = await getAuthHeaders();
  const { searchParams } = request.nextUrl;

  const params = new URLSearchParams();
  searchParams.forEach((value, key) => params.set(key, value));
  const query = params.toString();

  const res = await fetch(`${API_URL}/api/v1/profit-margins/tiers${query ? `?${query}` : ''}`, {
    headers
  });
  const raw = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: raw.message || 'Failed to fetch tiers', errors: raw.errors },
      { status: res.status }
    );
  }

  // Normalize response: backend may return { data, meta } or { items, meta } or plain array
  const data = Array.isArray(raw) ? raw : (raw.data ?? raw.items ?? []);
  const hasNextPage = raw.meta?.hasNextPage ?? raw.hasNextPage ?? false;

  return NextResponse.json({ data, hasNextPage });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/profit-margins/tiers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to create tier', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
