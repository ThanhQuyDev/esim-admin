import { NextRequest } from 'next/server';
import { proxyAdminMembershipTiers } from '../_proxy';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tier: string }> }
) {
  const { tier } = await params;
  const body = await request.text();
  return proxyAdminMembershipTiers(`/${encodeURIComponent(tier)}`, { method: 'PATCH', body });
}
