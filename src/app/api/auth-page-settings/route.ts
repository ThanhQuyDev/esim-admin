import { NextRequest } from 'next/server';
import { proxyAuthPageSettings } from './_proxy';

export async function GET(request: NextRequest) {
  return proxyAuthPageSettings(request, '');
}
