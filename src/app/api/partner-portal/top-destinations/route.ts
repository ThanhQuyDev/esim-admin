import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

/** Destinations this partner's buyers bought most (#012). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/top-destinations');
}
