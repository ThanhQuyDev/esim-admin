import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** What a no-deposit partner owes for a month (vande #056). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminPartners(request, `/${id}/credit-statement`);
}
