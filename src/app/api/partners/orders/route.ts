import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** "Đơn hàng đối tác": the partner screens, with the scope opened up (#071). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/orders');
}
