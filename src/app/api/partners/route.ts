import { NextRequest } from 'next/server';
import { proxyAdminPartners } from './_proxy';

export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '');
}
