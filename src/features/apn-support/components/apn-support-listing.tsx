import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { apnSupportQueryOptions } from '../api/queries';
import { buildApnSupportFilters } from '../utils/apn-support-filters';
import { ApnSupportTable } from './apn-support-table';

export default function ApnSupportListingPage() {
  // Built exactly as the table builds it, or the prefetched query is not the one
  // the table reads.
  const filters = buildApnSupportFilters({
    page: searchParamsCache.get('page'),
    perPage: searchParamsCache.get('perPage'),
    apn: searchParamsCache.get('apn'),
    supports: searchParamsCache.get('supports'),
    review: searchParamsCache.get('review')
  });

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(apnSupportQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApnSupportTable />
    </HydrationBoundary>
  );
}
