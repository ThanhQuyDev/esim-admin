import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../../_proxy';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminPartners(request, `/payouts/${id}/approve`, { method: 'POST' });
}
