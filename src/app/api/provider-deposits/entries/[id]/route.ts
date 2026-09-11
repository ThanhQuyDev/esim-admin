import { NextRequest } from 'next/server';
import { proxyProviderDeposits } from '../../_proxy';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyProviderDeposits(request, `/entries/${id}`, {
    method: 'PATCH',
    body: await request.text()
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyProviderDeposits(request, `/entries/${id}`, { method: 'DELETE' });
}
