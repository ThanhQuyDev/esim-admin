import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../../_proxy';

/** "Gửi lại email eSIM" (doitac-1410 #039). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ iccid: string }> }
) {
  const { iccid } = await params;
  return proxyPartnerPortal(request, `/me/esims/${encodeURIComponent(iccid)}/resend-email`, {
    method: 'POST'
  });
}
