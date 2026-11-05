import { NextRequest, NextResponse } from 'next/server';
import { proxyCustomerAnnouncements } from '../_proxy';

/** "Xem" and "Xoá" on a sent announcement (vande-0411 #059). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyCustomerAnnouncements(`/${encodeURIComponent(id)}`);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await proxyCustomerAnnouncements(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return res.status === 204 ? new NextResponse(null, { status: 204 }) : res;
}
