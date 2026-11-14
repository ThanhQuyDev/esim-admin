import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** The commission statement file, as the monthly email carries it (vande-1411 #047). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const res = await fetch(
    `${API_URL}/api/v1/admin/partners/${id}/commission-statement/export-excel${request.nextUrl.search}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: data.message || 'Không xuất được file đối soát' },
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
        res.headers.get('content-disposition') || 'attachment; filename="Doi-soat-hoa-hong.xlsx"'
    }
  });
}
