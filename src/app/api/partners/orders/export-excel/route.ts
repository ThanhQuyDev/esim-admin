import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * The admin's partner-order list as a spreadsheet (#071).
 *
 * Passes the open tab and its filters through, so the file matches the table
 * the admin is looking at rather than every partner order ever placed.
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const res = await fetch(
    `${API_URL}/api/v1/admin/partners/orders/export-excel${request.nextUrl.search}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: data.message || 'Không xuất được danh sách đơn hàng' },
      { status: res.status }
    );
  }

  const blob = await res.arrayBuffer();
  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type':
        res.headers.get('content-type') ||
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        res.headers.get('content-disposition') || 'attachment; filename="don-hang-doi-tac.xlsx"'
    }
  });
}
