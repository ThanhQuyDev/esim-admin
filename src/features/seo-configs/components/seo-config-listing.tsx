import { Suspense } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { seoConfigsQueryOptions } from '../api/queries';
import { SeoConfigsTable, SeoConfigsTableSkeleton } from './seo-configs-table';

export default function SeoConfigListingPage() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(seoConfigsQueryOptions({ page: 1, limit: 10 }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<SeoConfigsTableSkeleton />}>
        <SeoConfigsTable />
      </Suspense>
    </HydrationBoundary>
  );
}
