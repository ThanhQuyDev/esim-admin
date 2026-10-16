import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** The price list's "Điểm đến" options (doitac-1410 #033). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/catalogue/locations');
}
