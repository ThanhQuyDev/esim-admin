import { consoleRoleId } from '@/config/role-access';

/**
 * The role id inside the session JWT (`{ id, role: { id }, sessionId }`), read
 * on the server without verifying it (vande #040): it only decides which menu
 * the console draws first. Every API call is still checked by the backend.
 */
export function roleIdFromToken(token: string | undefined): number | undefined {
  const payload = token?.split('.')[1];
  if (!payload) return undefined;
  try {
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    // With the roles ticked on top of the main one (vande #071).
    return consoleRoleId(json?.role?.id, json?.extraRoleIds);
  } catch {
    return undefined;
  }
}
