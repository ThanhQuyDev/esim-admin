import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../_session';

/** "Gửi lại mã" on the code step of a two-step sign-in (vande-1411 #005). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${API_URL}/api/v1/auth/email/login/2fa/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge: body.challenge })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Không gửi lại được mã.', errors: data.errors },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
