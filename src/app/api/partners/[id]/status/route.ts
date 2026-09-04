import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/${id}/status`, { method: 'PATCH', body });
}
