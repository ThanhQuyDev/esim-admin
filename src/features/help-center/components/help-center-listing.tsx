import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { helpCenterQueryOptions } from '../api/queries';
import { buildHelpCenterApiFilters } from '../utils/help-center-filters';
import { HelpCenterTable } from './help-center-table';

export default function HelpCenterListingPage() {
  // Built exactly as HelpCenterTable builds it, or the prefetched query is not
  // the one the table reads — this used to send only `search` (#053).
  const filters = buildHelpCenterApiFilters({
    page: searchParamsCache.get('page'),
    limit: searchParamsCache.get('perPage'),
    name: searchParamsCache.get('name'),
    category: searchParamsCache.get('category'),
    parent: searchParamsCache.get('parent'),
    language: searchParamsCache.get('language'),
    popular: searchParamsCache.get('popular'),
    isPublished: searchParamsCache.get('isPublished')
  });
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(helpCenterQueryOptions(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HelpCenterTable />
    </HydrationBoundary>
  );
}
