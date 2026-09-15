import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  return {
    'Content-Type': 'application/json',
    'x-custom-lang': 'en',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

/** Brands with their models, for the ordering screen (#047). */
export async function GET() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/v1/supported-devices/ordering`, { headers });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to fetch device ordering', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

/** Save brand and model positions in bulk (#047). */
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/supported-devices/ordering`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to save device ordering', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
