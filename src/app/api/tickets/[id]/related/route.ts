import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

type Params = { params: Promise<{ id: string }> };

/** Earlier tickets about the same eSIM or order (doitac-3010 #006). */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const token = (await cookies()).get('token')?.value;

  const res = await fetch(`${API_URL}/api/v1/tickets/${id}/related`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const data = await res.json().catch(() => []);

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Không thể tải lịch sử ticket' },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
