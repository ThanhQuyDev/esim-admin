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

  // Normalize response to { data, hasNextPage, totalCount }
  if (Array.isArray(raw)) {
    return NextResponse.json({
      data: raw,
      hasNextPage: false,
      totalCount: raw.length
    });
  }

  // If backend already returns { data, hasNextPage, totalCount }
  if (Array.isArray(raw.data)) {
    return NextResponse.json({
      data: raw.data,
      hasNextPage: raw.hasNextPage ?? false,
      totalCount: raw.totalCount ?? raw.total ?? raw.data.length
    });
  }

  // Nested: { data: { data: [...], ... } }
  if (raw.data && typeof raw.data === 'object' && Array.isArray(raw.data.data)) {
    return NextResponse.json({
      data: raw.data.data,
      hasNextPage: raw.data.hasNextPage ?? false,
      totalCount: raw.data.totalCount ?? raw.data.total ?? raw.data.data.length
    });
  }

  // Fallback: try items/orders/results
  const items = raw.items ?? raw.orders ?? raw.results ?? [];
  return NextResponse.json({
    data: items,
    hasNextPage: raw.hasNextPage ?? raw.meta?.hasNextPage ?? false,
    totalCount: raw.totalCount ?? raw.meta?.totalCount ?? raw.total ?? items.length
  });
}
