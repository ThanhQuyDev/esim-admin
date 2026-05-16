import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { heroBannerQueryOptions } from '../api/queries';
import { HeroBannerTable } from './hero-banners-table';

export default function HeroBannerListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');
  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(sort && { sort })
  };
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(heroBannerQueryOptions(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HeroBannerTable />
    </HydrationBoundary>
  );
}
