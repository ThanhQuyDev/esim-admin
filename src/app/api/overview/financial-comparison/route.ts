import { NextRequest } from 'next/server';
import { proxyOverviewRequest } from '../_proxy';

export async function GET(request: NextRequest) {
  return proxyOverviewRequest(request, '/financial-comparison');
}
