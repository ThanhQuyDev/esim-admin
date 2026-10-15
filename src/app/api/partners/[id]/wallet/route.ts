import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** The wallet popup's "Thông tin" tab (doitac-1410 #004). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminPartners(request, `/${id}/wallet`);
}
