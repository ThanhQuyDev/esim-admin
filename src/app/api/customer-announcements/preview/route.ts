import { NextRequest } from 'next/server';
import { proxyCustomerAnnouncements } from '../_proxy';

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyCustomerAnnouncements('/preview', { method: 'POST', body });
}
