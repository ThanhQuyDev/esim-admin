import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

/** The eSIMs a distribution partner has taken delivery of (#046). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/esims');
}
