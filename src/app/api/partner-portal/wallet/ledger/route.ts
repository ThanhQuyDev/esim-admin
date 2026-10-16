import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../_proxy';

/** "Lịch sử giao dịch" with its filters (doitac-1410 #031). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/wallet/ledger');
}
