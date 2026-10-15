import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../../_proxy';

/** Ask esim.vn to restore a deleted link (doitac-1410 #019). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyPartnerPortal(request, `/me/links/${id}/restore-request`, { method: 'POST', body });
}
