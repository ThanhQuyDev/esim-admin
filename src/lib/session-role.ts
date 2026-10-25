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
    const id = Number(json?.role?.id);
    return Number.isFinite(id) ? id : undefined;
  } catch {
    return undefined;
  }
}
