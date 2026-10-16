import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** "Chi tiết đơn hàng" of one of the partner's own orders (doitac-1410 #042). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  return proxyPartnerPortal(request, `/me/purchases/${encodeURIComponent(orderNumber)}`);
}
