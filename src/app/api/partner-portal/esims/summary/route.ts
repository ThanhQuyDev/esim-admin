import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** This month against last month on Quản lý eSIM (doitac-3010 #028). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/esims/summary');
}
