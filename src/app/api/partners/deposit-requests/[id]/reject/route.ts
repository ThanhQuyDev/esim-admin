import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../../_proxy';

/** "Từ chối" a deposit request, with the reason (doitac-1410 #063). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/deposit-requests/${id}/reject`, { method: 'POST', body });
}
