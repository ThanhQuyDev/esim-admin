import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../../_proxy';

/** Email a no-deposit partner their statement now (vande #056). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminPartners(request, `/${id}/credit-statement/send`, { method: 'POST' });
}
