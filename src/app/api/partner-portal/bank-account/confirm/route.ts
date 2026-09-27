import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** Apply the requested bank account once the code checks out (#005). */
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyPartnerPortal(request, '/me/bank-account/confirm', { method: 'POST', body });
}
