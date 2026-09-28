import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** The names for the "lọc theo đối tác" select box (#071). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/orders/partner-options');
}
