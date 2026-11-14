import { NextRequest } from 'next/server';
import { API_URL, finishSignIn } from './_session';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${API_URL}/api/v1/auth/email/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return finishSignIn(req, res, 'Login failed');
}
