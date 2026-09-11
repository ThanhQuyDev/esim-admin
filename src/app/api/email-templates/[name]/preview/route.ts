import { NextRequest } from 'next/server';
import { proxyEmailTemplates } from '../../_proxy';

type Params = { params: Promise<{ name: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { name } = await params;
  return proxyEmailTemplates(`/${encodeURIComponent(name)}/preview`, {
    method: 'POST',
    body: await request.text()
  });
}
