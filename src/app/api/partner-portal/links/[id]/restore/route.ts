import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../../_proxy';

/** A marketing link's restore (doitac-1410 #018). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyPartnerPortal(request, `/me/links/${id}/restore`, { method: 'POST', body });
}
