import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * The conversation on one support ticket (#032).
 *
 * Tickets live outside `/partners`, so this does not go through the portal
 * proxy — the backend decides who may read the thread from the JWT.
 */
async function forward(request: NextRequest, id: string, init?: { method: string; body: string }) {
  const token = (await cookies()).get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const res = await fetch(`${API_URL}/api/v1/tickets/${id}/messages`, {
    method: init?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    ...(init?.body ? { body: init.body } : {})
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Không tải được nội dung trao đổi' },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forward(request, id);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forward(request, id, { method: 'POST', body: await request.text() });
}
