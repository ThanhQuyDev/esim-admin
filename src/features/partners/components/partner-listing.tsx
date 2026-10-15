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
      {/*
        A flex column, not `space-y-4`: from `lg` up the DataTable fills the
        height left over (`flex-1` + an absolutely placed table), so a plain
        block parent gave it none and the rows rendered 0px tall — the footer
        said "13 hàng" over an empty box (#001 doitac-1410).
      */}
      <div className='flex flex-1 flex-col gap-4'>
        <PartnerListStats />
        <Suspense fallback={<PartnersTableSkeleton />}>
          <PartnersTable />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}
