import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** The partners bringing in the most, for the foot of the overview (#054). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/top-partners');
}
