import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** "Thay đổi trạng thái" for the ticked links (doitac-1410 #053). */
export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return proxyAdminPartners(request, '/links/bulk-status', { method: 'PATCH', body });
}
