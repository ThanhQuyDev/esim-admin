import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../../_proxy';

/** "Gửi lại email eSIM" for a whole order (doitac-1410 #042). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  return proxyPartnerPortal(
    request,
    `/me/purchases/${encodeURIComponent(orderNumber)}/resend-email`,
    { method: 'POST' }
  );
}
