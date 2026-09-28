import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** The four figures at the head of the partner list (#057). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/list-stats');
}
