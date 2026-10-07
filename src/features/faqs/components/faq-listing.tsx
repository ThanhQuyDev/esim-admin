import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { faqsQueryOptions } from '../api/queries';
import { buildFaqApiFilters } from '../utils/faq-filters';
import { FaqsTable } from './faqs-table';

export default function FaqListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');
  // Built exactly as FaqsTable builds it, keys in the same order, or the
  // prefetched query is not the one the table reads.
  const apiFilters = buildFaqApiFilters({
    name: searchParamsCache.get('name'),
    pageUrl: searchParamsCache.get('pageUrl'),
    isActive: searchParamsCache.get('isActive')
  });
  const filters = {
    page,
    limit: pageLimit,
    ...(Object.keys(apiFilters).length > 0 && { filters: JSON.stringify(apiFilters) }),
    ...(sort && { sort })
  };
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(faqsQueryOptions(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FaqsTable />
    </HydrationBoundary>
  );
}
