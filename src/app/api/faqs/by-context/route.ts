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
  for (const key of ['url', 'blogId', 'language', 'limit']) {
    const val = searchParams.get(key);
    if (val) params.set(key, val);
  }
  const query = params.toString();
  const res = await fetch(`${API_URL}/api/v1/faqs/by-context${query ? `?${query}` : ''}`, {
    headers
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to fetch', errors: data.errors },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
