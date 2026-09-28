import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** A partner's status history, with the reason each time (#060). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminPartners(request, `/${id}/status-history`);
}
