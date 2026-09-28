import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

/** The orders a distribution partner placed themselves (#046). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/purchases');
}
