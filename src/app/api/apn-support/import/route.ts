import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  // No Content-Type here: fetch sets the multipart boundary itself, and naming
  // the type by hand omits it and makes the upload unparseable.
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Uploading an APN sheet REPLACES the whole table (#065). */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/apn-support/import`, {
    method: 'POST',
    headers,
    body: formData
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Nhập file APN thất bại', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
