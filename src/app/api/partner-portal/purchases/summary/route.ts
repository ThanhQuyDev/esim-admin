import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** This month against last month on Đơn hàng (doitac-3010 #029). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/purchases/summary');
}
