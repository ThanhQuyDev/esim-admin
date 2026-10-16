import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../../_proxy';

/** "Xem chi tiết" of a partner order (doitac-1410 #058). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  return proxyAdminPartners(request, `/orders/${encodeURIComponent(orderNumber)}/detail`);
}
