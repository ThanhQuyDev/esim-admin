import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

/** Per-channel performance of the partner's links (doitac-1410 #019). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/links-channels');
}
