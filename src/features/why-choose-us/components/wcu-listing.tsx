import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { wcuQueryOptions } from '../api/queries';
import { buildWcuApiFilters } from '../utils/wcu-filters';
import { WcuTable } from './wcu-table';

export default function WcuListingPage() {
  const sort = searchParamsCache.get('sort');
  // Built exactly as WcuTable builds it, or the prefetched query is not the one
  // the table reads.
  const filters = buildWcuApiFilters({
    page: searchParamsCache.get('page'),
    limit: searchParamsCache.get('perPage'),
    name: searchParamsCache.get('name'),
    type: searchParamsCache.get('type'),
    isActive: searchParamsCache.get('isActive'),
    ...(sort ? { sort } : {})
  });
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(wcuQueryOptions(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WcuTable />
    </HydrationBoundary>
  );
}
