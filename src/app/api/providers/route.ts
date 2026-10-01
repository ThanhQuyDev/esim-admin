import { NextRequest } from 'next/server';
import { proxyProviders } from './_proxy';

export async function GET(request: NextRequest) {
  return proxyProviders(request, '');
}
