import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * File Excel chứa toàn bộ eSIM của một đơn (#046, quyết định A3).
 *
 * Nhị phân nên không đi qua proxy JSON — proxy đó `JSON.parse` thân phản hồi
 * và sẽ làm hỏng file.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const res = await fetch(
    `${API_URL}/api/v1/partners/me/purchases/${encodeURIComponent(orderNumber)}/esims`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: data.message || 'Không tải được danh sách eSIM của đơn này' },
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
        res.headers.get('content-disposition') || `attachment; filename="esim-${orderNumber}.xlsx"`
    }
  });
}
