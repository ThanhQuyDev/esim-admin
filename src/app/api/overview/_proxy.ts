import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const OVERVIEW_BASE_URL = `${API_URL}/api/v1/overview`;

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function proxyOverviewRequest(request: NextRequest, path = '') {
  const headers = await getAuthHeaders();
  const query = request.nextUrl.searchParams.toString();
  const res = await fetch(`${OVERVIEW_BASE_URL}${path}${query ? `?${query}` : ''}`, { headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to fetch overview data', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
