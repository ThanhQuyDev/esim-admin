import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { couponsQueryOptions } from '../api/queries';
import { CouponsTable } from './coupons-table/index';

export default function CouponListingPage() {
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

  void queryClient.prefetchQuery(couponsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CouponsTable />
    </HydrationBoundary>
  );
}
