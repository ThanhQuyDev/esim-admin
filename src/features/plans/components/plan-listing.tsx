import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { plansQueryOptions } from '../api/queries';
import { PlansTable } from './plans-table';

export default function PlanListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const provider = searchParamsCache.get('provider');
  const isCheapest = searchParamsCache.get('isCheapest');
  const isActive = searchParamsCache.get('isActive');
  const type = searchParamsCache.get('type');
  const tags = searchParamsCache.get('tags');
  const duration = searchParamsCache.get('duration');
  const dataFilter = searchParamsCache.get('data');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');

  const apiFilters: Record<string, unknown> = {};
  if (search) apiFilters.search = search;
  if (provider && provider.length > 0) {
    apiFilters.provider = provider;
  }
  if (isCheapest && isCheapest.length === 1) {
    apiFilters.isCheapest = isCheapest[0] === 'true';
  }
  if (isActive && isActive.length === 1) {
    apiFilters.isActive = isActive[0] === 'true';
  }
  if (type && type.length > 0) {
    apiFilters.type = type.length === 1 ? type[0] : type;
  }
  if (tags && tags.length > 0) {
    apiFilters.tags = tags;
  }
  if (duration) {
    const durationNum = Number(duration);
    if (!isNaN(durationNum)) apiFilters.duration = durationNum;
  }
  if (dataFilter) {
    apiFilters.data = dataFilter;
  }

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
