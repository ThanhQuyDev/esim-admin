import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** The figures on top of "Tiếp thị liên kết" (doitac-1410 #051). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/links/stats');
}
