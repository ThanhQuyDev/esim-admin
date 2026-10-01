import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

/** Bảng giá đối tác phân phối — "Sản phẩm & bảng giá" (#046). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/catalogue');
}
