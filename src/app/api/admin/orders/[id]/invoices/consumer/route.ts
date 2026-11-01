import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

type Params = { params: Promise<{ id: string }> };

/**
 * "Số hóa đơn VAT" for an order without an invoice request (doitac-3010
 * #044): a consumer invoice, issued at once with only its number.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const token = (await cookies()).get('token')?.value;

  const res = await fetch(
    `${API_URL}/api/v1/admin/orders/${encodeURIComponent(id)}/invoices/consumer`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to issue invoice', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: res.status });
}
