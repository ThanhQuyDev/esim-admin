import { NextRequest } from 'next/server';
import { proxyProviders } from '../../_proxy';

type Params = { params: Promise<{ provider: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { provider } = await params;
  return proxyProviders(request, `/${encodeURIComponent(provider)}/sales-status`, {
    method: 'PUT',
    body: await request.text()
  });
}
