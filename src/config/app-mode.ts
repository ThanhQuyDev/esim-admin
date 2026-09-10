/**
 * Which deployment of this app we are: the admin console or the partner portal.
 *
 * One codebase is deployed twice against different hostnames:
 *
 *   admin.esim.vn    NEXT_PUBLIC_APP_MODE=admin    (or unset)
 *   doitac.esim.vn   NEXT_PUBLIC_APP_MODE=partner
 *
 * The mode decides which navigation is rendered AND which routes the
 * deployment is allowed to serve at all — see `src/middleware.ts`. Keeping both
 * decisions in this one module is deliberate: a nav that hides a screen while
 * the route still answers is not a separation, it is decoration.
 *
 * Authorization itself is still enforced by the backend (`@Roles`) on every
 * endpoint. This module is the second layer, so a partner never even reaches an
 * admin screen to be rejected by it.
 */

export type AppMode = 'admin' | 'partner';

/** Hostname prefix of the partner-portal deployment. */
export const PARTNER_HOST_PREFIX = 'doitac.';

/** Hostname prefix of the admin deployment. */
export const ADMIN_HOST_PREFIX = 'admin.';

/**
 * Mode baked in at build time. `NEXT_PUBLIC_` so client components can read it;
 * the middleware additionally derives the mode from the request hostname, which
 * wins when it is recognizable (see `resolveAppMode`).
 */
export const APP_MODE: AppMode =
  process.env.NEXT_PUBLIC_APP_MODE === 'partner' ? 'partner' : 'admin';

export const IS_PARTNER_PORTAL = APP_MODE === 'partner';

export const ADMIN_HOME_PATH = '/dashboard/overview';
export const PARTNER_HOME_PATH = '/dashboard/portal/overview';

/** Landing route after sign-in for a given mode. */
export function homePathFor(mode: AppMode): string {
  return mode === 'partner' ? PARTNER_HOME_PATH : ADMIN_HOME_PATH;
}

/** Landing route for THIS deployment. */
export const HOME_PATH = homePathFor(APP_MODE);

/** Sidebar branding, so the partner portal does not present itself as "Admin". */
export const APP_BRAND = IS_PARTNER_PORTAL
  ? { title: 'Cổng đối tác', subtitle: 'esim.vn' }
  : { title: 'Dashboard', subtitle: 'Admin' };

/** Routes only the partner portal may serve. */
export const PARTNER_ONLY_PREFIXES = ['/dashboard/portal', '/api/partner-portal'] as const;

/**
 * Routes both deployments serve: sign-in/out, and the public partner
 * registration form together with the endpoint it posts to.
 */
export const SHARED_PREFIXES = [
  '/auth',
  '/api/auth',
  '/register/partner',
  '/api/partner-portal/apply',
  // User-scoped support tickets: the admin console lists everyone's tickets
  // through `/api/tickets`, which stays admin-only, while `/api/tickets/mine`
  // only ever returns the caller's own and is needed by both deployments.
  '/api/tickets/mine'
] as const;

/** True when `pathname` is `prefix` itself or a path below it. */
export function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Resolve the mode for one request. A recognizable hostname wins over the
 * build-time env var so that a partner deployment shipped with a missing or
 * wrong `NEXT_PUBLIC_APP_MODE` still refuses to serve admin screens.
 */
export function resolveAppMode(hostname: string | null | undefined): AppMode {
  const host = (hostname ?? '').toLowerCase();
  if (host.startsWith(PARTNER_HOST_PREFIX)) return 'partner';
  if (host.startsWith(ADMIN_HOST_PREFIX)) return 'admin';
  return APP_MODE;
}
