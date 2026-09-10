import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** One partner's marketing links and discount codes, for the detail screen (#095). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminPartners(request, `/${id}/marketing`);
}
