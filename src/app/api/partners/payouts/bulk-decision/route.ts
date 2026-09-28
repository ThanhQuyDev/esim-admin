import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** "Duyệt chi" or "Từ chối" for the rows an admin ticked (#069). */
export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return proxyAdminPartners(request, '/payouts/bulk-decision', { method: 'PATCH', body });
}
