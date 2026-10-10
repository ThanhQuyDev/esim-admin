import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** The APN table as .xlsx, passed through as bytes (#044). */
export async function GET() {
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${API_URL}/api/v1/apn-support/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: data.message || 'Xuất file APN thất bại' },
      { status: res.status }
    );
  }
  return new NextResponse(await res.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type':
        res.headers.get('Content-Type') ??
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        res.headers.get('Content-Disposition') ?? 'attachment; filename="apn-tiktok-gpt.xlsx"'
    }
  });
}
