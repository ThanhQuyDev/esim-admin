// Which admin-console pages each role may open (#011).
//
// The backend is what actually refuses a request — every CMS write needs the
// admin role there. This decides what the console *shows*: an author signs in
// to write blog posts, so they get the Blog menu and their profile, and any
// other page they reach by typing its URL says they have no access.

export const ROLE_ADMIN = 1;
export const ROLE_AUTHOR = 3;

/** Roles that may sign in to the admin console at all. */
export const ADMIN_CONSOLE_ROLES = [ROLE_ADMIN, ROLE_AUTHOR];

/** Where an author lands, and the only pages they may open. */
export const AUTHOR_HOME_PATH = '/dashboard/blogs';
const AUTHOR_PATH_PREFIXES = ['/dashboard/blogs', '/dashboard/profile'];

const matches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function canOpenPath(roleId: number | undefined, pathname: string): boolean {
  if (roleId === ROLE_ADMIN) return true;
  if (roleId === ROLE_AUTHOR) {
    return AUTHOR_PATH_PREFIXES.some((prefix) => matches(pathname, prefix));
  }
  return false;
}
