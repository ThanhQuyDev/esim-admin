import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../../_proxy';

/** "Hoàn tiền" on a distribution partner's order (doitac-1410 #058). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/orders/${encodeURIComponent(orderNumber)}/refund`, {
    method: 'POST',
    body
  });
}
