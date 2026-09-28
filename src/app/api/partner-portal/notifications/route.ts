import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

/** Announcements this partner can see, for the bell (#079). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/notifications');
}
