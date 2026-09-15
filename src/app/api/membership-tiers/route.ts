import { proxyAdminMembershipTiers } from './_proxy';

export async function GET() {
  return proxyAdminMembershipTiers('');
}
