import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../../_proxy';

/** "Duyệt hoa hồng" on one order's commission (vande-1411 #048). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ commissionId: string }> }
) {
  const { commissionId } = await params;
  return proxyAdminPartners(request, `/commissions/${commissionId}/credit`, { method: 'PATCH' });
}
