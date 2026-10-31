import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

type Params = { params: Promise<{ id: string }> };

/** How far a background Gadget import has got (doitac-3010 #008). */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const token = (await cookies()).get('token')?.value;

  const res = await fetch(
    `${API_URL}/api/v1/plans/import-gadgetkorea/jobs/${encodeURIComponent(id)}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: 'no-store' }
  );
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Không đọc được tiến độ nhập file.' },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
