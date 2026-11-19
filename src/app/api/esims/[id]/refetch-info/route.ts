import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

type Params = { params: Promise<{ id: string }> };

/** "Lấy lại thông tin eSIM" (vande-2011 #004): a read, nothing is bought. */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${API_URL}/api/v1/esims/${encodeURIComponent(id)}/refetch-info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Không lấy lại được thông tin eSIM', errors: data.errors },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
