import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { blogsQueryOptions } from '../api/queries';
import { BlogsTable, BlogsTableSkeleton } from './blogs-table';

export default function BlogListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');
  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(sort && { sort })
  };
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(blogsQueryOptions(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<BlogsTableSkeleton />}>
        <BlogsTable />
      </Suspense>
    </HydrationBoundary>
  );
}
