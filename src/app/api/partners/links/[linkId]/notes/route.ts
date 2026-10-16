import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../../_proxy';

/** "Thêm ghi chú nội bộ" on a link (doitac-1410 #055). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/links/${encodeURIComponent(linkId)}/notes`, {
    method: 'POST',
    body
  });
}
