import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminPartners(request, `/${id}`);
}
