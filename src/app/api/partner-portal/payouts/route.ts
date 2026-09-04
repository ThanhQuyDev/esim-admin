import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/payouts');
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyPartnerPortal(request, '/me/payouts', { method: 'POST', body });
}
