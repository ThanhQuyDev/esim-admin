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

export async function GET() {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/profit-margins`, { headers });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to fetch profit margin', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/profit-margins`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to update profit margin', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
