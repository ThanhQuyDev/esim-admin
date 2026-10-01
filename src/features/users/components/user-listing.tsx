import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { usersQueryOptions } from '../api/queries';
import { buildUserApiFilters } from '../utils/user-filters';
import { roleIdsForTab, type UserTab } from './user-tab-config';
import { UsersTable } from './users-table';

export default function UserListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');
  const tab = (searchParamsCache.get('tab') as UserTab | null) ?? 'user';

  const apiFilters = buildUserApiFilters({
    name: searchParamsCache.get('name'),
    customerCode: searchParamsCache.get('customerCode'),
    membershipTier: searchParamsCache.get('membershipTier'),
    userStatus: searchParamsCache.get('userStatus')
  });

  // Built exactly as the client builds it, keys in the same order — the query key
  // is compared by value, so a different shape here silently wastes the prefetch.
  const filters = {
    page,
    limit: pageLimit,
    roleIds: roleIdsForTab(tab),
    ...(Object.keys(apiFilters).length > 0 && {
      filters: JSON.stringify(apiFilters)
    }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(usersQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersTable />
    </HydrationBoundary>
  );
}
