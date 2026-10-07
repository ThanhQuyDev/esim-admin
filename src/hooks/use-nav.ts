'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { NavItem, NavGroup } from '@/types';
import { authMeQueryOptions } from '@/features/auth/api/queries';
import { IS_PARTNER_PORTAL } from '@/config/app-mode';
import { canOpenPath } from '@/config/role-access';

function itemAllowedForRole(item: NavItem, roleId: number | undefined): boolean {
  if (item.access?.role) {
    if (roleId === undefined) return false;
    if (!item.access.role.includes(roleId)) return false;
  }
  // An author only gets the pages role-access allows (#011). Groups ('#') are
  // kept or dropped by what is left of their children. Before the role is
  // known nothing is hidden, so an admin's sidebar does not flash empty.
  if (!IS_PARTNER_PORTAL && roleId !== undefined && item.url && item.url !== '#') {
    return canOpenPath(roleId, item.url);
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
  const { data: user } = useQuery(authMeQueryOptions);
  const roleId = user?.role?.id;
  return useMemo(() => filterItems(items, roleId), [items, roleId]);
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  const { data: user } = useQuery(authMeQueryOptions);
  const roleId = user?.role?.id;
  return useMemo(
    () =>
      groups
        .map((group) => ({ ...group, items: filterItems(group.items, roleId) }))
        .filter((group) => group.items.length > 0),
    [groups, roleId]
  );
}
