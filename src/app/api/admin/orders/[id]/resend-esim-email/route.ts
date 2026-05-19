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

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/admin/orders/${id}/resend-esim-email`, {
    method: 'POST',
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to resend eSIM email', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
