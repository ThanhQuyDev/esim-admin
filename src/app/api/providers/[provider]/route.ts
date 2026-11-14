import { NextRequest } from 'next/server';
import { proxyProviders } from '../_proxy';

type Params = { params: Promise<{ provider: string }> };

/** "Cập nhật": its name and overview code (vande-1411 #024). */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { provider } = await params;
  return proxyProviders(request, `/${encodeURIComponent(provider)}`, {
    method: 'PATCH',
    body: await request.text()
  });
}

/** "Xoá": the backend refuses one with an API, plans or eSIMs. */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { provider } = await params;
  return proxyProviders(request, `/${encodeURIComponent(provider)}`, {
    method: 'DELETE'
  });
}
