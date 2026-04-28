import { Suspense } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { miniTagsQueryOptions } from '../api/queries';
import { MiniTagsTable, MiniTagsTableSkeleton } from './mini-tags-table';

export default function MiniTagListingPage() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(miniTagsQueryOptions({ page: 1, limit: 10 }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<MiniTagsTableSkeleton />}>
        <MiniTagsTable />
      </Suspense>
    </HydrationBoundary>
  );
}
