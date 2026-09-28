import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** Mark every announcement this partner can see as read (#079). */
export async function POST(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/notifications/read-all', { method: 'POST' });
}
