import { NextRequest } from 'next/server';
import { proxyCustomerAnnouncements } from '../_proxy';

export async function GET(request: NextRequest) {
  return proxyCustomerAnnouncements(`/audience-count${request.nextUrl.search}`);
}
