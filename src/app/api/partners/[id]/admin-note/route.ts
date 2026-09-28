import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** Record an admin's own note on a partner (#056). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/${id}/admin-note`, { method: 'PATCH', body });
}
