import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** Contract details and this partner's own deposit limits (#061). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/${id}/profile`, { method: 'PATCH', body });
}
