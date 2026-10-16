import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../../_proxy';

/** Báo giá cả giỏ hàng (doitac-1410 #035). */
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyPartnerPortal(request, '/me/purchases/cart/quote', { method: 'POST', body });
}
