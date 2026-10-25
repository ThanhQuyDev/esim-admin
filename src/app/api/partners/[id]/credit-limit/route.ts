import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** "Không cần ký quỹ" + "Hạn mức giao dịch" for a partner (vande #056). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/${id}/credit-limit`, { method: 'PATCH', body });
}
