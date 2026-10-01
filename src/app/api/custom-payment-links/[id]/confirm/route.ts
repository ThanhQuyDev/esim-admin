import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/** An admin confirming a pending payment link as paid or failed (#056). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get('token')?.value;
  const body = await request.json();

  const res = await fetch(
    `${API_URL}/api/v1/custom-payment-links/${encodeURIComponent(id)}/confirm`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    }
  );

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message || 'Không cập nhật được trạng thái', errors: data?.errors },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
