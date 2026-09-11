import { NextRequest } from 'next/server';
import { proxyProviderDeposits } from '../_proxy';

export async function GET(request: NextRequest) {
  return proxyProviderDeposits(request, '/summary');
}
