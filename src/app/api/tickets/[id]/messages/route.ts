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

type Params = { params: Promise<{ id: string }> };

/** The conversation on a ticket (#059). */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/tickets/${id}/messages`, { headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Không thể tải hội thoại', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

/** An admin reply; the backend also emails it to the customer (#059). */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const headers = await getAuthHeaders();
  const body = await request.json();

  const res = await fetch(`${API_URL}/api/v1/tickets/${id}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Không gửi được phản hồi', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
