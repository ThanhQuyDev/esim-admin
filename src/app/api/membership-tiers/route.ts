import { NextRequest } from 'next/server';
import { proxyAdminMembershipTiers } from './_proxy';

export async function GET() {
  return proxyAdminMembershipTiers('');
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyAdminMembershipTiers('', { method: 'POST', body });
}
