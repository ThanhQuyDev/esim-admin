import { NextRequest } from 'next/server';
import { API_URL, finishSignIn } from '../_session';

/** The code step of a two-step sign-in (vande-1411 #005). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${API_URL}/api/v1/auth/email/login/2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge: body.challenge, code: body.code })
  });

  return finishSignIn(req, res, 'Mã xác thực không đúng.');
}
