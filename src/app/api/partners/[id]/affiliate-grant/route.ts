import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** Tick/untick "được phân quyền affiliate" for a partner (#048). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/${id}/affiliate-grant`, { method: 'PATCH', body });
}
