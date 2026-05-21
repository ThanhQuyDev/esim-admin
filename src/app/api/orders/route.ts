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

  const res = await fetch(`${API_URL}/api/v1/orders?${params}`, { headers });
  const raw = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: raw.message || 'Failed to fetch orders', errors: raw.errors },
      { status: res.status }
    );
  }

  // Normalize: backend may return array, { data, hasNextPage, totalCount } or { items, meta }
  const data = Array.isArray(raw) ? raw : (raw.data ?? raw.items ?? []);
  const hasNextPage = raw.hasNextPage ?? raw.meta?.hasNextPage ?? false;
  const totalCount =
    raw.totalCount ??
    raw.meta?.totalCount ??
    raw.total ??
    (Array.isArray(raw) ? raw.length : undefined);

  return NextResponse.json({
    data,
    hasNextPage,
    ...(typeof totalCount === 'number' ? { totalCount } : {})
  });
}
