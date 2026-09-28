import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** Revenue and orders over time, split by partner type (#052). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/series-by-type');
}
