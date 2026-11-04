import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../../_proxy';

/** "Gọi lại API lấy eSIM" (vande-0411 #011). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  return proxyPartnerPortal(
    request,
    `/me/purchases/${encodeURIComponent(orderNumber)}/retry-provisioning`,
    { method: 'POST' }
  );
}
