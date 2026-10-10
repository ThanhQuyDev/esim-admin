import { NextRequest } from 'next/server';
import { proxyApnSupport } from '../_proxy';

type Params = { params: Promise<{ id: string }> };

/** Edit one APN row (#044). */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyApnSupport(request, `/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: await request.text()
  });
}

/** Delete one APN row (#044). */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyApnSupport(request, `/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
