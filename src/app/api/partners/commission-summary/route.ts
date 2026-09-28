import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../_proxy';

/** The five figures at the head of "Hoa hồng & Đối soát" (#063). */
export async function GET(request: NextRequest) {
  return proxyAdminPartners(request, '/commission-summary');
}
