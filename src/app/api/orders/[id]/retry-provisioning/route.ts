import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

type Params = { params: Promise<{ id: string }> };

/**
 * Proxy for "Gọi lại API lấy eSIM" (#014).
 *
 * This route did not exist, so the button posted to a path Next.js had no
 * handler for and every click came back 404 — the "bấm vào bị báo lỗi" in the
 * report. The backend endpoint itself was fine.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const token = (await cookies()).get('token')?.value;
  // The body carries the chosen item ids, and is absent when the caller wants
  // every eligible line.
  const body = await request.text();

  const res = await fetch(`${API_URL}/api/v1/orders/${id}/retry-provisioning`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body || '{}'
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    return NextResponse.json(
      {
        message: data?.message || 'Failed to retry provisioning',
        errors: data?.errors
      },
      { status: res.status }
    );
  }

  return data === null ? new NextResponse(null, { status: res.status }) : NextResponse.json(data);
}
