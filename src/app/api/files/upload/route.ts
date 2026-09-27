import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Upload one document and hand back a URL (#032).
 *
 * The API stores the file and returns a path relative to its own host, so the
 * absolute URL is built here — a bare `/api/v1/files/...` would point at this
 * app, which does not serve them.
 */
export async function POST(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const res = await fetch(`${API_URL}/api/v1/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: await request.formData()
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Không tải được tệp lên' },
      { status: res.status }
    );
  }

  const path: string | undefined = data?.file?.path;
  const url = path?.startsWith('http') ? path : `${API_URL}${path ?? ''}`;

  return NextResponse.json({ url });
}
