import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** The reconciliation list: one row per partner for one period (#065). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/reconciliations');
}
