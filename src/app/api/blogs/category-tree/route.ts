import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** Blog categories (vande #076): the tree, and adding a category. */
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
  const res = await fetch(`${API_URL}/api/v1/blogs/category-tree`, { headers, cache: 'no-store' });
  const data = await res.json();
  if (!res.ok)
    return NextResponse.json(
      { message: data.message || 'Failed to fetch categories', errors: data.errors },
      { status: res.status }
    );
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const headers = await getAuthHeaders();
  const body = await request.json();
  const res = await fetch(`${API_URL}/api/v1/blogs/category-tree`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok)
    return NextResponse.json(
      { message: data.message || 'Failed to create category', errors: data.errors },
      { status: res.status }
    );
  return NextResponse.json(data, { status: 201 });
}
