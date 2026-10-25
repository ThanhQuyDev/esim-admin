import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** The bulk order file template, with "Email nhận QR" (vande #057) — binary. */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const res = await fetch(`${API_URL}/api/v1/admin/orders/bulk/import-template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: data.message || 'Không tải được file mẫu' },
      { status: res.status }
    );
  }

  return new NextResponse(await res.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type':
        res.headers.get('content-type') ||
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        res.headers.get('content-disposition') ||
        'attachment; filename="File-mau-dat-esim-hang-loat.xlsx"'
    }
  });
}
