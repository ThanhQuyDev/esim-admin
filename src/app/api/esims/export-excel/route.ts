import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const headers = await getAuthHeaders();

  const params = new URLSearchParams();
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');
  const filters = searchParams.get('filters');
  const sort = searchParams.get('sort');

  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  if (filters) params.set('filters', filters);
  if (sort) params.set('sort', sort);

  const res = await fetch(`${API_URL}/api/v1/esims/export-excel?${params}`, {
    headers
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: data.message || 'Failed to export esims' },
      { status: res.status }
    );
  }

  const blob = await res.arrayBuffer();
  const contentType =
    res.headers.get('content-type') ||
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const contentDisposition =
    res.headers.get('content-disposition') || 'attachment; filename="esims-export.xlsx"';

  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition
    }
  });
}
