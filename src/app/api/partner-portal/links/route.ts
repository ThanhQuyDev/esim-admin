import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/links');
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyPartnerPortal(request, '/me/links', { method: 'POST', body });
}
