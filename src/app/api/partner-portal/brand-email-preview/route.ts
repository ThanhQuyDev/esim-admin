import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

/** The real eSIM email in the brand being edited (doitac-3010 #004). */
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyPartnerPortal(request, '/me/brand/email-preview', { method: 'POST', body });
}
