import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { buildCatalogApiFilters } from '@/lib/catalog-filters';
import { destinationsQueryOptions } from '../api/queries';
import { DestinationsTable } from './destinations-table/index';

export default function DestinationListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');

  const apiFilters = buildCatalogApiFilters({
    name: searchParamsCache.get('name'),
    isPopular: searchParamsCache.get('isPopular'),
    isActive: searchParamsCache.get('isActive'),
    providers: searchParamsCache.get('providers')
  });

  const sort = searchParamsCache.get('sort');

  // Built exactly as the client builds it, keys in the same order — the query key
  // is compared by value, so a different shape here silently wastes the prefetch.
  const filters = {
    page,
    limit: pageLimit,
    ...(Object.keys(apiFilters).length > 0 && {
      filters: JSON.stringify(apiFilters)
    }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(destinationsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DestinationsTable />
    </HydrationBoundary>
  );
}
