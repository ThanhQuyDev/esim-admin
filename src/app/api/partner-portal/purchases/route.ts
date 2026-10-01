import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

/** The orders a distribution partner placed themselves (#046). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/purchases');
}

/** Đặt mua và trừ ví ngay (#046). */
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyPartnerPortal(request, '/me/purchases', { method: 'POST', body });
}
