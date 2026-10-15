import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

type Params = { params: Promise<{ promotionId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { promotionId } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/deposit-promotions/${promotionId}`, {
    method: 'PATCH',
    body
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { promotionId } = await params;
  return proxyAdminPartners(request, `/deposit-promotions/${promotionId}`, { method: 'DELETE' });
}
