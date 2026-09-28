import { NextRequest } from 'next/server';
import { proxyAdminPartners } from './_proxy';

export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '');
}

/** Create a partner account by hand (#059). */
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyAdminPartners(request, '', { method: 'POST', body });
}
