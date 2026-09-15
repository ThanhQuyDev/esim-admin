import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { blogsQueryOptions } from '../api/queries';
import { BlogsTable, BlogsTableSkeleton } from './blogs-table';
import { blogCategoryFilters } from '../utils/category-filter';

export default function BlogListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');
  // Same key order as BlogsTable, so the prefetched query is the one it reads (#054).
  const categoryFilters = blogCategoryFilters(
    searchParamsCache.get('category'),
    searchParamsCache.get('parent')
  );
  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(categoryFilters && { filters: categoryFilters }),
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
