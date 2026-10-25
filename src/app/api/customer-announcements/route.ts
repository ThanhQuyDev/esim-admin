import { NextRequest } from 'next/server';
import { proxyCustomerAnnouncements } from './_proxy';

export async function GET() {
  return proxyCustomerAnnouncements('');
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyCustomerAnnouncements('', { method: 'POST', body });
}
