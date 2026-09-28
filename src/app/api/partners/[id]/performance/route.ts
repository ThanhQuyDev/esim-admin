import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** Link and code performance over the last 30 days (#061). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminPartners(request, `/${id}/performance`);
}
