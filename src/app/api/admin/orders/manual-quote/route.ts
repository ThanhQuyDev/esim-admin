import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** "Đặt đơn hộ": a line's cost and price (vande-1411 #015). */
export async function GET(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${API_URL}/api/v1/admin/orders/manual-quote${request.nextUrl.search}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Không tính được giá.', errors: data.errors },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
