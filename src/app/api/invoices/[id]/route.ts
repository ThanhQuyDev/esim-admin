import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

type Params = { params: Promise<{ id: string }> };

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

/**
 * Update one invoice (used by the "Phát hành hóa đơn" button, which flips the
 * status to ISSUED and triggers the invoice email).
 *
 * The upstream NestJS route is `@Patch(':id')` — forwarding the browser's PUT
 * as PUT made Nest answer 404, so the button silently failed. Always forward
 * as PATCH, and accept either verb from the client.
 */
async function updateInvoice(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/invoices/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to update invoice', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

export const PUT = updateInvoice;
export const PATCH = updateInvoice;
