import { NextRequest } from 'next/server';
import { proxyOverviewRequest } from '../_proxy';

/** "Nguồn truy cập" on Tổng quan, vande-0411 #052. */
export async function GET(request: NextRequest) {
  return proxyOverviewRequest(request, '/traffic-sources');
}
