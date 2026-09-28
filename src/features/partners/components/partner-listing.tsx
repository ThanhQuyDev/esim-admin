import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { Suspense } from 'react';
import { partnerListStatsQueryOptions, partnersQueryOptions } from '../api/queries';
import { PartnerListStats } from './partner-list-stats';
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
  // The tiles at the head of the page (#057); prefetched alongside the table so
  // the two arrive together rather than the numbers popping in afterwards.
  void queryClient.prefetchQuery(partnerListStatsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='space-y-4'>
        <PartnerListStats />
        <Suspense fallback={<PartnersTableSkeleton />}>
          <PartnersTable />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}
