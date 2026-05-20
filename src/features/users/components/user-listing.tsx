import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { usersQueryOptions } from '../api/queries';
import { roleIdsForTab, type UserTab } from './user-tab-config';
import { UsersTable } from './users-table';

export default function UserListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');
  const tab = (searchParamsCache.get('tab') as UserTab | null) ?? 'user';

  const filters = {
    page,
    limit: pageLimit,
    roleIds: roleIdsForTab(tab),
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
