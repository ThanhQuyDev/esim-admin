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
  const { searchParams } = request.nextUrl;
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  for (const key of ['page', 'limit', 'filters', 'sort']) {
    const val = searchParams.get(key);
    if (val) params.set(key, val);
  }
  const res = await fetch(`${API_URL}/api/v1/why-choose-us?${params}`, { headers });
  const data = await res.json();
  if (!res.ok)
    return NextResponse.json(
      { message: data.message || 'Failed to fetch', errors: data.errors },
      { status: res.status }
    );
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/v1/why-choose-us`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok)
    return NextResponse.json(
      { message: data.message || 'Failed to create', errors: data.errors },
      { status: res.status }
    );
  return NextResponse.json(data, { status: 201 });
}
