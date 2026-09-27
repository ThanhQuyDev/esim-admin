import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** Turn one of the partner's own codes on or off (#028). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyPartnerPortal(request, `/me/coupons/${id}`, { method: 'PATCH', body });
}
