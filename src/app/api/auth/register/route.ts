import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${API_URL}/api/v1/auth/email/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Registration failed' },
      { status: res.status }
    );
  }

  const cookieStore = await cookies();

  cookieStore.set('token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor((data.tokenExpires - Date.now()) / 1000)
  });

  cookieStore.set('refreshToken', data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60
  });

  return NextResponse.json(data);
}
