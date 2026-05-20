// Single source of truth for the Users page "user" / "admin" tab split.
// Backend uses role.id where 1 = Admin, 2 = User (see users-table/options.tsx).

export const USER_TAB_VALUES = ['user', 'admin'] as const;
export type UserTab = (typeof USER_TAB_VALUES)[number];

export const USER_TAB_DEFAULT: UserTab = 'user';

const TAB_TO_ROLE_IDS: Record<UserTab, number[]> = {
  user: [2],
  admin: [1]
};

export function roleIdsForTab(tab: UserTab): number[] {
  return TAB_TO_ROLE_IDS[tab];
}
