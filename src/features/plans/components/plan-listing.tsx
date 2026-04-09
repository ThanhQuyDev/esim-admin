import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { plansQueryOptions } from '../api/queries';
import { PlansTable } from './plans-table';

export default function PlanListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');

  const apiFilters: Record<string, unknown> = {};
  if (search) apiFilters.search = search;

  const filters = {
    page,
    limit: pageLimit,
    ...(Object.keys(apiFilters).length > 0 && {
      filters: JSON.stringify(apiFilters)
    }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(plansQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlansTable />
    </HydrationBoundary>
  );
}
