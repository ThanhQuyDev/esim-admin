import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { footerQueryOptions } from '../api/queries';
import { FooterTable } from './footers-table';

export default function FooterListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const category = searchParamsCache.get('category');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');
  // Same key order as FooterTable's filters, so the prefetched query is the
  // one the client reads.
  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(category && { category }),
    ...(sort && { sort })
  };
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(footerQueryOptions(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FooterTable />
    </HydrationBoundary>
  );
}
