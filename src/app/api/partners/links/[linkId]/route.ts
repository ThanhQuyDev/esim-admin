import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** One link with its history, for "Xem chi tiết" (doitac-1410 #054, #055). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  return proxyAdminPartners(request, `/links/${encodeURIComponent(linkId)}`);
}
