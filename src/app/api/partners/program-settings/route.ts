import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** The partner programme's settings (#075, #076, #077). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/program-settings');
}

export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return proxyAdminPartners(request, '/program-settings', { method: 'PATCH', body });
}
