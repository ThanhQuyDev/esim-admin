import { NextRequest } from 'next/server';
import { proxyCustomerAnnouncements } from '../../_proxy';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyCustomerAnnouncements(`/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
}
