import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { footerQueryOptions } from '../api/queries';
import { FooterTable } from './footers-table';

export default function FooterListingPage() {
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
  void queryClient.prefetchQuery(footerQueryOptions(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FooterTable />
    </HydrationBoundary>
  );
}
