import { NextRequest } from 'next/server';
import { proxyOverviewRequest } from '../_proxy';

/** Tổng quan, vande #059. */
export async function GET(request: NextRequest) {
  return proxyOverviewRequest(request, '/audience');
}
