import { Suspense } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { searchParamsCache } from '@/lib/searchparams';
import { seoConfigsQueryOptions } from '../api/queries';
import { buildSeoConfigApiFilters } from '../utils/seo-config-filters';
import { SeoConfigsTable, SeoConfigsTableSkeleton } from './seo-configs-table';

export default function SeoConfigListingPage() {
  const queryClient = getQueryClient();

  // Built exactly as the table builds it, keys in the same order — the prefetch
  // used to hardcode page 1 with no filters, so any filtered load threw it away.
  const apiFilters = buildSeoConfigApiFilters({
    name: searchParamsCache.get('name'),
    pageType: searchParamsCache.get('pageType'),
    metaTitle: searchParamsCache.get('metaTitle'),
    metaDescription: searchParamsCache.get('metaDescription'),
    isActive: searchParamsCache.get('isActive')
  });

  const sort = searchParamsCache.get('sort');

  void queryClient.prefetchQuery(
    seoConfigsQueryOptions({
      page: searchParamsCache.get('page'),
      limit: searchParamsCache.get('perPage'),
      ...(Object.keys(apiFilters).length > 0 && {
        filters: JSON.stringify(apiFilters)
      }),
      ...(sort && { sort })
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<SeoConfigsTableSkeleton />}>
        <SeoConfigsTable />
      </Suspense>
    </HydrationBoundary>
  );
}
