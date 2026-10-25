import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** "Gửi yêu cầu ký quỹ" with the proof attached (vande #069). */
export async function POST(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  const formData = await request.formData();

  // No Content-Type here: fetch sets the multipart boundary itself.
  const res = await fetch(`${API_URL}/api/v1/partners/me/wallet/deposit-requests/manual`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Gửi yêu cầu ký quỹ thất bại', errors: data.errors },
      { status: res.status }
    );
  }
  return NextResponse.json(data, { status: 201 });
}
