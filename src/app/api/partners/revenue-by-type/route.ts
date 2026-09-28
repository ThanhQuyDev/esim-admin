import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** What esim.vn keeps from each kind of partner, over a period (#050). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/revenue-by-type');
}
