import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { wcuQueryOptions } from '../api/queries';
import { WcuTable } from './wcu-table';

export default function WcuListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');
  const apiFilters: Record<string, unknown> = {};
  if (search) apiFilters.search = search;
  const filters = {
    page,
    limit: pageLimit,
    ...(Object.keys(apiFilters).length > 0 && { filters: JSON.stringify(apiFilters) }),
    ...(sort && { sort })
  };
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(wcuQueryOptions(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WcuTable />
    </HydrationBoundary>
  );
}
