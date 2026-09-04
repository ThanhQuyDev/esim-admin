import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me');
}

export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return proxyPartnerPortal(request, '/me', { method: 'PATCH', body });
}
