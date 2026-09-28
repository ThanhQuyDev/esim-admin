import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** Where partner-driven orders are going (#052). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/top-destinations');
}
