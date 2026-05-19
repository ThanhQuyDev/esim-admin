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

  const res = await fetch(`${API_URL}/api/v1/tickets${query ? `?${query}` : ''}`, { headers });
  const raw = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: raw.message || 'Không thể tải danh sách tickets', errors: raw.errors },
      { status: res.status }
    );
  }

  // Normalize: backend returns { data, hasNextPage }
  const data = Array.isArray(raw) ? raw : (raw.data ?? raw.items ?? []);
  const hasNextPage = raw.hasNextPage ?? raw.meta?.hasNextPage ?? false;
  const totalCount = raw.totalCount ?? raw.meta?.totalCount;

  return NextResponse.json({
    data,
    hasNextPage,
    ...(typeof totalCount === 'number' ? { totalCount } : {})
  });
}
