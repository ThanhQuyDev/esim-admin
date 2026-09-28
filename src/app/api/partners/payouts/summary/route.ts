import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** The four figures at the head of "Tài chính" (#067). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/payouts/summary');
}
