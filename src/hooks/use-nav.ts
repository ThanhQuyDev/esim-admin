'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { NavItem, NavGroup } from '@/types';
import { authMeQueryOptions } from '@/features/auth/api/queries';

function itemAllowedForRole(item: NavItem, roleId: number | undefined): boolean {
  if (!item.access?.role) return true;
  if (roleId === undefined) return false;
  return item.access.role.includes(roleId);
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
