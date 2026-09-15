import { queryOptions } from '@tanstack/react-query';
import { getBlogs, getBlog, getBlogCategoryTree } from './service';
import type { Blog, BlogFilters } from './types';

export type { Blog };

export const blogKeys = {
  all: ['blogs'] as const,
  list: (filters: BlogFilters) => [...blogKeys.all, 'list', filters] as const,
  detail: (id: string) => [...blogKeys.all, 'detail', id] as const,
  categoryTree: () => [...blogKeys.all, 'category-tree'] as const
};

/** Categories and their sub-categories, for the list filter (#054). */
export const blogCategoryTreeQueryOptions = () =>
  queryOptions({
    queryKey: blogKeys.categoryTree(),
    queryFn: () => getBlogCategoryTree(),
    staleTime: 5 * 60 * 1000
  });

export const blogsQueryOptions = (filters: BlogFilters) =>
  queryOptions({ queryKey: blogKeys.list(filters), queryFn: () => getBlogs(filters) });

export const blogQueryOptions = (id: string) =>
  queryOptions({ queryKey: blogKeys.detail(id), queryFn: () => getBlog(id) });
