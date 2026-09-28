import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

/** Dashboard figures for a distribution partner (#043). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/distribution-summary');
}
