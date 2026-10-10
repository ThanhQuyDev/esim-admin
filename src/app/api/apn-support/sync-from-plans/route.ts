import { NextRequest } from 'next/server';
import { proxyApnSupport } from '../_proxy';

/** Pull every APN the suppliers' plans use into the table (#044). */
export async function POST(request: NextRequest) {
  return proxyApnSupport(request, '/sync-from-plans', { method: 'POST' });
}
