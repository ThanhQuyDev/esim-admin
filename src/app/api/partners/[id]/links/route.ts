import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** Create a marketing link on a partner's behalf (#061). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/${id}/links`, { method: 'POST', body });
}
