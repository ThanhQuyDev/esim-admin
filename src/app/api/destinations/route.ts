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
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');
  const filters = searchParams.get('filters');
  const sort = searchParams.get('sort');

  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  if (filters) params.set('filters', filters);
  if (sort) params.set('sort', sort);

  const res = await fetch(`${API_URL}/api/v1/destinations?${params}`, { headers });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to fetch destinations', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/destinations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to create destination', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
