import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { helpCenterQueryOptions } from '../api/queries';
import { HelpCenterTable } from './help-center-table';

export default function HelpCenterListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search })
  };
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(helpCenterQueryOptions(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HelpCenterTable />
    </HydrationBoundary>
  );
}
