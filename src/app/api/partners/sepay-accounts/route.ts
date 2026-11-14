import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** The SePay accounts an admin picks between for a partner (vande-1411 #046). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/sepay-accounts');
}
