import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** A marketing partner's commission statement for a month (vande-1411 #047). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminPartners(request, `/${id}/commission-statement`);
}
