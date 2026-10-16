import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** "Xuất file" of the admin's link list, with its filters (doitac-1410 #053). */
export async function GET(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(
    `${API_URL}/api/v1/admin/partners/links/export-excel${request.nextUrl.search}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: data.message || 'Không xuất được danh sách liên kết' },
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
        'attachment; filename="Danh-sach-lien-ket-tiep-thi.xlsx"'
    }
  });
}
