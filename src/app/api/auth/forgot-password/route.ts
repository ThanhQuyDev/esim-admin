import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * "Quên mật khẩu" on the admin and partner sign-in pages (#016, test round 4).
 * The API emails a reset link (from no-reply@, in Vietnamese and English);
 * the answer is the same whether or not the address exists.
 */
export async function POST(req: NextRequest) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const res = await fetch(`${API_URL}/api/v1/auth/forgot/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: String(email ?? '').trim() })
  });
  if (!res.ok && res.status !== 404 && res.status !== 422) {
    return NextResponse.json(
      { message: 'Không gửi được email, vui lòng thử lại.' },
      { status: 502 }
    );
  }
  return new NextResponse(null, { status: 204 });
}
