import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { Suspense } from 'react';
import { partnersQueryOptions } from '../api/queries';
import { PartnersTable, PartnersTableSkeleton } from './partners-table/index';

export default function PartnerListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search })
  };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(partnersQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<PartnersTableSkeleton />}>
        <PartnersTable />
      </Suspense>
    </HydrationBoundary>
  );
}
