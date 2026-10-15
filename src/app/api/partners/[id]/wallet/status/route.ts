import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../../_proxy';

/** Freeze or release the partner's wallet (doitac-1410 #004). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/${id}/wallet/status`, { method: 'PATCH', body });
}
