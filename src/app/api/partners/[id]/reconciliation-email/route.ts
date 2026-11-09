import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** Tick/untick "Gửi email đối soát" for a partner (doitac-0911 #008). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/${id}/reconciliation-email`, { method: 'PATCH', body });
}
