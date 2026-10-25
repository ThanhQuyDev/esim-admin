import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** The proof a partner sent with a manual top-up, to look at again (vande #069). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id, fileId } = await params;
  const token = (await cookies()).get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const res = await fetch(
    `${API_URL}/api/v1/partners/me/wallet/deposit-requests/${encodeURIComponent(id)}/proofs/${encodeURIComponent(fileId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    return NextResponse.json({ message: 'Không mở được bằng chứng.' }, { status: res.status });
  }
  return new NextResponse(res.body, {
    status: 200,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Disposition': res.headers.get('content-disposition') ?? 'inline',
      'Cache-Control': 'private, no-store'
    }
  });
}
