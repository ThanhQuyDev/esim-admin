'use client';

import { useMemo } from 'react';
import type { NavItem, NavGroup } from '@/types';
import { useRoleId } from '@/components/layout/session-role';
import { IS_PARTNER_PORTAL } from '@/config/app-mode';
import { canOpenPath } from '@/config/role-access';

function itemAllowedForRole(item: NavItem, roleId: number | undefined): boolean {
  if (item.access?.role) {
    if (roleId === undefined) return false;
    if (!item.access.role.includes(roleId)) return false;
  }
  // An author only gets the pages role-access allows (#011). Groups ('#') are
  // kept or dropped by what is left of their children. The role is known from
  // the session cookie on the first paint; when it is not, nothing is shown —
  // showing everything let an author see the whole admin menu while the page
  // loaded (vande #040).
  if (!IS_PARTNER_PORTAL && item.url && item.url !== '#') {
    return roleId !== undefined && canOpenPath(roleId, item.url);
  }
  return true;
}

function filterItems(items: NavItem[], roleId: number | undefined): NavItem[] {
  return items
    .filter((item) => itemAllowedForRole(item, roleId))
    .map((item) =>
      item.items?.length ? { ...item, items: filterItems(item.items, roleId) } : item
    )
    .filter((item) => !item.items || item.items.length > 0 || !item.access);
}

/** Filters nav items by the current user's role (item.access.role, matching AuthUser.role.id). */
export function useFilteredNavItems(items: NavItem[]) {
  const { roleId } = useRoleId();
  return useMemo(() => filterItems(items, roleId), [items, roleId]);
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  const { roleId } = useRoleId();
  return useMemo(
    () =>
      groups
        .map((group) => ({ ...group, items: filterItems(group.items, roleId) }))
        .filter((group) => group.items.length > 0),
    [groups, roleId]
  );
}
