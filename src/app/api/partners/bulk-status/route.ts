import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** Change several partners' status at once (#059). */
export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return proxyAdminPartners(request, '/bulk-status', { method: 'PATCH', body });
}
