import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** Sign off (or hold) one or more statements (#065). */
export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return proxyAdminPartners(request, '/reconciliations/status', { method: 'PATCH', body });
}
