import { NextRequest } from 'next/server';
import { proxyProviderDeposits } from '../_proxy';

export async function GET(request: NextRequest) {
  return proxyProviderDeposits(request, '/entries');
}

export async function POST(request: NextRequest) {
  return proxyProviderDeposits(request, '/entries', {
    method: 'POST',
    body: await request.text()
  });
}
