import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** The esimaccess package list, for each plan's APN (vande-0411 #027). */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = (await cookies()).get('token')?.value;

  const res = await fetch(`${API_URL}/api/v1/plans/import-esimaccess`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Nhập file esimaccess thất bại, vui lòng thử lại.' },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
