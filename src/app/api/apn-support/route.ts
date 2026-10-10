import { NextRequest } from 'next/server';
import { proxyApnSupport } from './_proxy';

/** The APN table, with its select-box filters (#044). */
export async function GET(request: NextRequest) {
  return proxyApnSupport(request, '');
}

/** Add one APN by hand (#044). */
export async function POST(request: NextRequest) {
  return proxyApnSupport(request, '', { method: 'POST', body: await request.text() });
}
