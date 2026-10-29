import { NextRequest } from 'next/server';
import { proxyProviders } from '../../_proxy';

/** The latest runs of the full catalogue sync (vande #078). */
export async function GET(request: NextRequest) {
  return proxyProviders(request, '/full-sync/history');
}
