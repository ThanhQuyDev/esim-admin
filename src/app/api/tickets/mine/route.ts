import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * The signed-in user's own tickets. Distinct from `/api/tickets`, which proxies
 * the admin-only listing of every customer's tickets.
 */
export async function GET(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  const query = request.nextUrl.search;

  const res = await fetch(`${API_URL}/api/v1/tickets/mine${query}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message || 'Không thể tải danh sách yêu cầu hỗ trợ' },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}

/** Open a new ticket as the signed-in user. */
export async function POST(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  const body = await request.text();

  const res = await fetch(`${API_URL}/api/v1/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message || 'Không thể tạo yêu cầu hỗ trợ', errors: data?.errors },
      { status: res.status }
    );
  }
  return NextResponse.json(data, { status: 201 });
}
