import { NextRequest } from 'next/server';
import { proxyPartnerPortal } from '../../../_proxy';

/** Mark one announcement read (#079). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPartnerPortal(request, `/me/notifications/${id}/read`, { method: 'POST' });
}
