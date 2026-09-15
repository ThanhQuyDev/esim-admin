import { NextRequest } from 'next/server';
import { proxyProviderSurcharges } from '../_proxy';

type Params = { params: Promise<{ provider: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { provider } = await params;
  return proxyProviderSurcharges(request, `/${encodeURIComponent(provider)}`, {
    method: 'PUT',
    body: await request.text()
  });
}
