import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Public — no auth. Registration form submits here (no token cookie yet).
export async function POST(request: NextRequest) {
  const body = await request.text();
  const res = await fetch(`${API_URL}/api/v1/partners/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message || 'Request failed', errors: data?.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: res.status });
}
