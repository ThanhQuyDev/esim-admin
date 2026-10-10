import { NextRequest } from 'next/server';
import { proxyApnSupport } from '../_proxy';

/** APN names for the filter's select box (#044). */
export async function GET(request: NextRequest) {
  return proxyApnSupport(request, '/options');
}
