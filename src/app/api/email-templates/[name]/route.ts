import { NextRequest } from 'next/server';
import { proxyEmailTemplates } from '../_proxy';

type Params = { params: Promise<{ name: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { name } = await params;
  return proxyEmailTemplates(`/${encodeURIComponent(name)}`);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { name } = await params;
  return proxyEmailTemplates(`/${encodeURIComponent(name)}`, {
    method: 'PATCH',
    body: await request.text()
  });
}
