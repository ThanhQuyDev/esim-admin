import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { Suspense } from 'react';
import { esimsQueryOptions } from '../api/queries';
import { buildEsimApiFilters } from '../utils/esim-filters';
import { EsimsTable, EsimsTableSkeleton } from './esims-table/index';

export default function EsimListingPage() {
  // One mapping shared with EsimsTable, so the prefetched query is the one it
  // reads. The server copy used to send `search` only, which meant every other
  // filter produced a cache miss and a second round trip (#020).
  const apiFilters = buildEsimApiFilters({
    name: searchParamsCache.get('name'),
    planName: searchParamsCache.get('planName'),
    packageType: searchParamsCache.get('packageType'),
    status: searchParamsCache.get('esimStatus'),
    provider: searchParamsCache.get('provider'),
    hasCallSms: searchParamsCache.get('hasCallSms'),
    topUp: searchParamsCache.get('topUp'),
    createdFrom: searchParamsCache.get('createdFrom'),
    createdTo: searchParamsCache.get('createdTo'),
    expiresFrom: searchParamsCache.get('expiresFrom'),
    expiresTo: searchParamsCache.get('expiresTo')
  });

  const sort = searchParamsCache.get('sort');
  const filters = {
    page: searchParamsCache.get('page'),
    limit: searchParamsCache.get('perPage'),
    ...(Object.keys(apiFilters).length > 0 && {
      filters: JSON.stringify(apiFilters)
    }),
    ...(sort ? { sort } : {})
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(esimsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<EsimsTableSkeleton />}>
        <EsimsTable />
      </Suspense>
    </HydrationBoundary>
  );
}
