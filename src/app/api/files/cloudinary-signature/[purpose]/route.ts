import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

type Params = { params: Promise<{ purpose: string }> };

/** A signed Cloudinary upload ticket from the API (security 15/11/2026). */
export async function POST(_request: Request, { params }: Params) {
  const { purpose } = await params;
  if (purpose !== 'cms' && purpose !== 'chat') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  const token = (await cookies()).get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const res = await fetch(`${API_URL}/api/v1/files/cloudinary-signature/${purpose}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
