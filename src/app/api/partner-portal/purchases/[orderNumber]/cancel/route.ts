import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../../_proxy';

/** Đối tác tự huỷ đơn chưa cấp eSIM và nhận lại tiền vào ví (#046, A5). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  return proxyPartnerPortal(request, `/me/purchases/${encodeURIComponent(orderNumber)}/cancel`, {
    method: 'POST'
  });
}
