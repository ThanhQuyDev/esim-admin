import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/coupons');
}

/** Create a discount code funded by the partner's own commission (#028). */
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyPartnerPortal(request, '/me/coupons', { method: 'POST', body });
}
