import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { ticketsQueryOptions } from '../api/queries';
import { TICKET_STATUSES, type TicketStatus } from '../api/types';
import { TicketsTable, TicketsTableSkeleton } from './tickets-table';
import { TicketsFilterBar } from './tickets-filter-bar';

export default function TicketListingPage() {
  const page = searchParamsCache.get('page');
  const perPage = searchParamsCache.get('perPage');
  const search = searchParamsCache.get('search');
  const rawStatus = searchParamsCache.get('status');
  const status = TICKET_STATUSES.includes(rawStatus as TicketStatus)
    ? (rawStatus as TicketStatus)
    : undefined;

  const filters = {
    page,
    limit: perPage,
    ...(search && { search }),
    ...(status && { status })
  };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(ticketsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='flex flex-1 flex-col gap-4'>
        <TicketsFilterBar />
        <Suspense fallback={<TicketsTableSkeleton />}>
          <TicketsTable />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}
