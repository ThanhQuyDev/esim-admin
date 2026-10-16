import { NextRequest } from 'next/server';
import { proxyProviders } from '../_proxy';

/** How "Cập nhật lại toàn bộ sản phẩm" is going (doitac-1410 #074). */
export async function GET(request: NextRequest) {
  return proxyProviders(request, '/full-sync');
}

/** Run the full catalogue sync now (doitac-1410 #074). */
export async function POST(request: NextRequest) {
  return proxyProviders(request, '/full-sync', { method: 'POST' });
}
