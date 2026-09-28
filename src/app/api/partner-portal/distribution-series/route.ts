import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

/** Orders bought and eSIMs activated over time, for the chart (#045). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/distribution-series');
}
