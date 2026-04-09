import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

type Params = { params: Promise<{ id: string }> };

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/destinations/${id}`, { headers });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Destination not found', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/destinations/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to update destination', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/destinations/${id}`, {
    method: 'DELETE',
    headers
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: data.message || 'Failed to delete destination', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json({ success: true });
}
