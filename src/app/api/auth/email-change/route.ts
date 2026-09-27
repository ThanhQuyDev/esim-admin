import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Changing the address you sign in with (#031).
 *
 * One route for the whole three-step flow — start, confirm the code sent to the
 * current address, confirm the one sent to the new address — because they are
 * the same conversation and splitting them into three files only spreads the
 * same twenty lines around.
 */
const STEPS = {
  request: { path: '/auth/me/email/change', method: 'POST' },
  'verify-current': { path: '/auth/me/email/change/verify-current', method: 'POST' },
  confirm: { path: '/auth/me/email/change/confirm', method: 'POST' }
} as const;

async function authToken() {
  return (await cookies()).get('token')?.value;
}

/** The change waiting to be confirmed, so a reload does not lose the step. */
export async function GET() {
  const token = await authToken();
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const res = await fetch(`${API_URL}/api/v1/auth/me/email/change`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Request failed' },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const token = await authToken();
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const { step, ...payload } = (await request.json()) as {
    step?: keyof typeof STEPS;
  } & Record<string, unknown>;

  const target = step && STEPS[step];
  if (!target) {
    return NextResponse.json({ message: 'Bước không hợp lệ' }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/api/v1${target.path}`, {
    method: target.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Không thực hiện được yêu cầu', errors: data?.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data ?? { ok: true });
}
