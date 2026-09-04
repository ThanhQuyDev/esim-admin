import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../../_proxy';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/${id}/wallet/adjust`, { method: 'POST', body });
}
