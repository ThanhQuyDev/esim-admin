import { NextRequest } from 'next/server';
import { proxyProviderSurcharges } from './_proxy';

export async function GET(request: NextRequest) {
  return proxyProviderSurcharges(request, '');
}
