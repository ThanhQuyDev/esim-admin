import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../../_proxy';

/** Email a marketing partner their statement now (vande-1411 #047). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminPartners(request, `/${id}/commission-statement/send`, { method: 'POST' });
}
