import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../../_proxy';

/** "Báo lỗi" / "Yêu cầu hoàn tiền" for a whole order (doitac-1410 #042). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const body = await request.text();
  return proxyPartnerPortal(request, `/me/purchases/${encodeURIComponent(orderNumber)}/requests`, {
    method: 'POST',
    body
  });
}
