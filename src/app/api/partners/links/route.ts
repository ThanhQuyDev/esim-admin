import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** Every partner's links, filtered (doitac-1410 #052, #054). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/links');
}
