import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** Orders, live partners and what is waiting to be settled (#051). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/activity-by-type');
}
