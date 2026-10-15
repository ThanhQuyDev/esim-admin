import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** The partner page's figures over the chosen period (doitac-1410 #004). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminPartners(request, `/${id}/stats`);
}
