import { NextRequest } from 'next/server';
import { proxyProviders } from './_proxy';

export async function GET(request: NextRequest) {
  return proxyProviders(request, '');
}

/** "+ Thêm nhà cung cấp" (vande-1411 #024). */
export async function POST(request: NextRequest) {
  return proxyProviders(request, '', {
    method: 'POST',
    body: await request.text()
  });
}
