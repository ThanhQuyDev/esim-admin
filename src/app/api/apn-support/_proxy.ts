import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Forward a CMS call to `/api/v1/apn-support…` with the admin's token (#044).
 *
 * Every query param is passed through — a fixed list is how new filters went
 * missing before (#040).
 */
export async function proxyApnSupport(
  request: NextRequest,
  path: string,
  init: { method?: string; body?: string } = {}
) {
  const token = (await cookies()).get('token')?.value;
  const res = await fetch(`${API_URL}/api/v1/apn-support${path}${request.nextUrl.search}`, {
    method: init.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(init.body !== undefined && { body: init.body })
  });

  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Yêu cầu APN thất bại', errors: data.errors },
      { status: res.status }
    );
  }
  return NextResponse.json(data, { status: res.status });
}
