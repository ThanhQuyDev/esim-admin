import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/wallet');
}
