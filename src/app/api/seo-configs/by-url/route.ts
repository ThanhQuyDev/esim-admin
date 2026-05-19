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
  const url = searchParams.get('url');
  if (!url) {
    return NextResponse.json({ message: 'url query param is required' }, { status: 400 });
  }

  const headers = await getAuthHeaders();
  const params = new URLSearchParams({ url });
  const res = await fetch(`${API_URL}/api/v1/seo-configs/by-url?${params}`, { headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to fetch SEO config', errors: data.errors },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
