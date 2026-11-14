import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * "Đăng nhập 2 lớp (OTP)" of the signed-in admin or partner (vande-1411
 * #005): GET the state; POST `enable`, `disable/code`, `disable`.
 */
async function forward(request: NextRequest, path: string[] | undefined, method: string) {
  const token = (await cookies()).get('token')?.value;
  const sub = (path ?? []).map(encodeURIComponent).join('/');
  const res = await fetch(`${API_URL}/api/v1/auth/me/two-factor${sub ? `/${sub}` : ''}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(method === 'POST' ? { body: (await request.text()) || '{}' } : {}),
    cache: 'no-store'
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const errors = data?.errors as Record<string, string> | undefined;
    const first = errors ? Object.values(errors).find((v) => typeof v === 'string') : undefined;
    return NextResponse.json(
      { message: data?.message || first || 'Thao tác không thành công.', errors },
      { status: res.status }
    );
  }
  return NextResponse.json(data ?? {});
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  return forward(request, (await params).path, 'GET');
}

export async function POST(request: NextRequest, { params }: Ctx) {
  return forward(request, (await params).path, 'POST');
}
