import { NextRequest } from 'next/server';
import { proxyAuthPageSettings } from '../_proxy';

type Params = { params: Promise<{ mode: string }> };

/** Read side is public on the backend: the sign-in page needs it before login. */
export async function GET(request: NextRequest, { params }: Params) {
  const { mode } = await params;
  return proxyAuthPageSettings(request, `/${encodeURIComponent(mode)}`);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { mode } = await params;
  return proxyAuthPageSettings(request, `/${encodeURIComponent(mode)}`, {
    method: 'PUT',
    body: await request.text()
  });
}
