import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { blogAuthorOptionsQueryOptions, blogsQueryOptions } from '../api/queries';
import { BlogsTable, BlogsTableSkeleton } from './blogs-table';
import { blogListFilters } from '../utils/category-filter';

export default function BlogListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');
  // Same key order as BlogsTable, so the prefetched query is the one it reads (#054).
  const listFilters = blogListFilters({
    category: searchParamsCache.get('category'),
    parent: searchParamsCache.get('parent'),
    author: searchParamsCache.get('author'),
    isPublished: searchParamsCache.get('isPublished'),
    popular: searchParamsCache.get('popular')
  });
  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(listFilters && { filters: listFilters }),
    ...(sort && { sort })
  };
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(blogsQueryOptions(filters));
  // The author select's options, so the toolbar does not pop in after the rows.
  void queryClient.prefetchQuery(blogAuthorOptionsQueryOptions());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<BlogsTableSkeleton />}>
        <BlogsTable />
      </Suspense>
    </HydrationBoundary>
  );
}
