import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** "Chi tiết eSIM" of one eSIM the partner bought (doitac-1410 #039). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ iccid: string }> }
) {
  const { iccid } = await params;
  return proxyPartnerPortal(request, `/me/esims/${encodeURIComponent(iccid)}`);
}
