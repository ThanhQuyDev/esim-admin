import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** Số tiền sẽ bị trừ, tính trước khi đối tác bấm mua (#046). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/purchases/quote');
}
