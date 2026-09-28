import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** Everything an admin has announced, with how far it reached (#079). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/notifications');
}

/** Compose and send an announcement to partners (#079). */
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyAdminPartners(request, '/notifications', { method: 'POST', body });
}
