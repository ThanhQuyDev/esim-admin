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

  // Every param, not a fixed list: the list dropped customerCode, customerName
  // and membershipTiers, so the CMS filters added for #040 never reached the
  // API (test round 4).
  const params = new URLSearchParams();
  for (const [key, val] of searchParams) {
    if (val) params.set(key, val);
  }

  const res = await fetch(`${API_URL}/api/v1/wallets/admin?${params}`, { headers });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to fetch wallets', errors: data.errors },
      { status: res.status }
    );
  }

  // Backend returns plain array; wrap into paginated shape expected by the table
  const normalized = Array.isArray(data) ? { data, hasNextPage: false } : data;
  return NextResponse.json(normalized);
}
