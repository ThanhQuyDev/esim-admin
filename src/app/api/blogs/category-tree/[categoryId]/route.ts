import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';
type Params = { params: Promise<{ categoryId: string }> };

/** Rename or delete a blog category (vande #076). */
async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { categoryId } = await params;
  const headers = await getAuthHeaders();
  const body = await request.json();
  const res = await fetch(`${API_URL}/api/v1/blogs/category-tree/${categoryId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok)
    return NextResponse.json(
      { message: data.message || 'Failed to rename category', errors: data.errors },
      { status: res.status }
    );
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { categoryId } = await params;
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/v1/blogs/category-tree/${categoryId}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: data.message || 'Failed to delete category', errors: data.errors },
      { status: res.status }
    );
  }
  return new NextResponse(null, { status: 204 });
}
