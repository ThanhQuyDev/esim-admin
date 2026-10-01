import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../_proxy';

/** Các phiếu báo eSIM lỗi của chính đối tác này (#046, A4). */
export async function GET(request: NextRequest) {
  return proxyPartnerPortal(request, '/me/esim-faults');
}

/** Báo một eSIM đã mua bị lỗi — admin duyệt tay mới hoàn tiền. */
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyPartnerPortal(request, '/me/esim-faults', { method: 'POST', body });
}
