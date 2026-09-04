import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyPartnerPortal(request, `/me/links/${id}`, { method: 'PATCH', body });
}
