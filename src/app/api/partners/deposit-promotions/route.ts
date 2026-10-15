import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** Deposit promotions (doitac-1410 #015). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/deposit-promotions');
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyAdminPartners(request, '/deposit-promotions', { method: 'POST', body });
}
