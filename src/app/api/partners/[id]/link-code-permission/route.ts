import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** Tick/untick "được đặt tên link tiếp thị" for a partner (#014). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/${id}/link-code-permission`, { method: 'PATCH', body });
}
