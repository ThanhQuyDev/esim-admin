import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** Thanh toán cả giỏ hàng (doitac-1410 #035). */
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyPartnerPortal(request, '/me/purchases/cart', { method: 'POST', body });
}
