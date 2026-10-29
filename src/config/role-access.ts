// Which admin-console pages each role may open (#011).
//
// The backend is what actually refuses a request — every CMS write needs the
// admin role there. This decides what the console *shows*: an author signs in
// to write blog posts, so they get the Blog menu, Mini Tags, Câu hỏi thường gặp
// (vande #086) and their profile; any other page they reach by typing its URL
// says they have no access.

export const ROLE_ADMIN = 1;
export const ROLE_AUTHOR = 3;

/** Roles that may sign in to the admin console at all. */
export const ADMIN_CONSOLE_ROLES = [ROLE_ADMIN, ROLE_AUTHOR];

/**
 * The role the console works as (vande #071). A user may hold several — an
 * admin who also writes, a customer who was also made an author — and the
 * console shows the most it may: admin if that is the main role, author if
 * writing is among them, otherwise the main role (which cannot sign in).
 */
export function consoleRoleId(
  mainRoleId: number | string | undefined | null,
  extraRoleIds: readonly (number | string)[] | undefined | null = []
): number | undefined {
  const main = Number(mainRoleId);
  if (main === ROLE_ADMIN) return ROLE_ADMIN;
  if (main === ROLE_AUTHOR || (extraRoleIds ?? []).map(Number).includes(ROLE_AUTHOR)) {
    return ROLE_AUTHOR;
  }
  return Number.isFinite(main) ? main : undefined;
}

/** Where an author lands, and the only pages they may open. */
export const AUTHOR_HOME_PATH = '/dashboard/blogs';
const AUTHOR_PATH_PREFIXES = [
  '/dashboard/blogs',
  '/dashboard/profile',
  // The tags and FAQs a post leans on (vande #086).
  '/dashboard/mini-tags',
  '/dashboard/faqs'
];

const matches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function canOpenPath(roleId: number | undefined, pathname: string): boolean {
  if (roleId === ROLE_ADMIN) return true;
  if (roleId === ROLE_AUTHOR) {
    return AUTHOR_PATH_PREFIXES.some((prefix) => matches(pathname, prefix));
  }
  return false;
}
