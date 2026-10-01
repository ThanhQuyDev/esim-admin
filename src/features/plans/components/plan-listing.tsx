import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { destinationsQueryOptions } from '@/features/destinations/api/queries';
import { regionsQueryOptions } from '@/features/regions/api/queries';
import { planApnOptionsQueryOptions, plansQueryOptions } from '../api/queries';
import { buildPlanApiFilters } from '../utils/plan-filters';
import { PlansTable } from './plans-table';

/** Must match the limit the table asks for, or the prefetch misses its key. */
const OPTIONS_LIMIT = 500;

export default function PlanListingPage() {
  const apiFilters = buildPlanApiFilters({
    name: searchParamsCache.get('name'),
    provider: searchParamsCache.get('provider'),
    isCheapest: searchParamsCache.get('isCheapest'),
    isActive: searchParamsCache.get('isActive'),
    type: searchParamsCache.get('type'),
    tags: searchParamsCache.get('tags'),
    duration: searchParamsCache.get('duration'),
    data: searchParamsCache.get('data'),
    country: searchParamsCache.get('country'),
    hasCallSms: searchParamsCache.get('hasCallSms'),
    apn: searchParamsCache.get('apn'),
    isNonHkIp: searchParamsCache.get('isNonHkIp'),
    topUp: searchParamsCache.get('topUp')
  });

  const sort = searchParamsCache.get('sort');
  const filters = {
    page: searchParamsCache.get('page'),
    limit: searchParamsCache.get('perPage'),
    ...(Object.keys(apiFilters).length > 0 && {
      filters: JSON.stringify(apiFilters)
    }),
    ...(sort ? { sort } : {})
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(plansQueryOptions(filters));
  // Filter option lists (#010) — prefetched so the table does not suspend on
  // them after the plan rows have already arrived.
  void queryClient.prefetchQuery(planApnOptionsQueryOptions());
  void queryClient.prefetchQuery(destinationsQueryOptions({ page: 1, limit: OPTIONS_LIMIT }));
  void queryClient.prefetchQuery(regionsQueryOptions({ page: 1, limit: OPTIONS_LIMIT }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlansTable />
    </HydrationBoundary>
  );
}
