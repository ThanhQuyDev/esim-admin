import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** Ask for the code that releases a bank account change (#005). */
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyPartnerPortal(request, '/me/bank-account/otp', { method: 'POST', body });
}
