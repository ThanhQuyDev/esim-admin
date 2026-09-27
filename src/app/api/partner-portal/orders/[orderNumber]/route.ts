import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** One attributed order with its timeline (#026). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  return proxyPartnerPortal(request, `/me/orders/${encodeURIComponent(orderNumber)}`);
}
