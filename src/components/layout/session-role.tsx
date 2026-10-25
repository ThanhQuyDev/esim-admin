'use client';

import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authMeQueryOptions } from '@/features/auth/api/queries';
import { consoleRoleId } from '@/config/role-access';

/**
 * The signed-in role as the server read it from the session cookie (vande
 * #040), so the console knows who is looking on its very first paint.
 *
 * The menu used to wait for `/auth/me`; until it answered nothing was hidden,
 * and an author on a slow load or a refresh saw the whole admin menu. The
 * cookie's role is only used to decide what to show — the backend checks
 * every request against the real session anyway.
 */
const SessionRoleContext = createContext<number | undefined>(undefined);

export function SessionRoleProvider({
  roleId,
  children
}: {
  roleId: number | undefined;
  children: React.ReactNode;
}) {
  return <SessionRoleContext.Provider value={roleId}>{children}</SessionRoleContext.Provider>;
}

/** The role from `/auth/me` once it answers, the cookie's until then. */
export function useRoleId(): { roleId: number | undefined; isPending: boolean } {
  const cookieRole = useContext(SessionRoleContext);
  const { data: user, isPending } = useQuery(authMeQueryOptions);
  return {
    // An author by an extra role works as an author here (vande #071).
    roleId: user ? consoleRoleId(user.role?.id, user.extraRoleIds) : cookieRole,
    isPending: isPending && cookieRole === undefined
  };
}
