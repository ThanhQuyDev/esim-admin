import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** The order file template (doitac-1410 #084) — binary. */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const res = await fetch(`${API_URL}/api/v1/partners/me/purchases/cart/import-template`, {
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
        'attachment; filename="File-mau-dat-nhieu-esim.xlsx"'
    }
  });
}
