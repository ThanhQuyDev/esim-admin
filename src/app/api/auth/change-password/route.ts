import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Change the signed-in staff member's own login password (#066).
 *
 * Proxies `PATCH /auth/me`, which verifies the old password and — importantly —
 * signs every OTHER session out, so a password changed because it may have
 * leaked actually locks the other party out.
 */
export async function POST(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const body = (await request.json()) as {
    oldPassword?: string;
    password?: string;
  };

  if (!body.oldPassword || !body.password) {
    return NextResponse.json(
      { message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' },
      { status: 422 }
    );
  }

  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      oldPassword: body.oldPassword,
      password: body.password
    })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message, errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json({ ok: true });
}
