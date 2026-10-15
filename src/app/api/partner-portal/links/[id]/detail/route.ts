import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../../_proxy';

/** A marketing link's detail (doitac-1410 #018). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPartnerPortal(request, `/me/links/${id}/detail`);
}
