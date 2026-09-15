import { NextRequest } from 'next/server';
import { proxyTopup } from '../../_proxy';

/** Admin tops an eSIM up for a customer without a gateway payment. */
export async function POST(request: NextRequest) {
  return proxyTopup(request, '/admin/manual', {
    method: 'POST',
    body: await request.text()
  });
}
