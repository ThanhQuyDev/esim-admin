import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../../_proxy';

/** "Topup hộ khách", paid from the deposit wallet (doitac-1410 #039). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ iccid: string }> }
) {
  const { iccid } = await params;
  const body = await request.text();
  return proxyPartnerPortal(request, `/me/esims/${encodeURIComponent(iccid)}/topup`, {
    method: 'POST',
    body
  });
}
