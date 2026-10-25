import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** Reads a bulk eSIM order file — up to 50 rows with emails — places nothing (vande #057). */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const formData = await request.formData();

  // No Content-Type here: fetch sets the multipart boundary itself.
  const res = await fetch(`${API_URL}/api/v1/admin/orders/bulk/import-file`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Không đọc được file', errors: data.errors },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
