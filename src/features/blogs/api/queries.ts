import { queryOptions } from '@tanstack/react-query';
import { getBlogs, getBlog } from './service';
import type { Blog, BlogFilters } from './types';

export type { Blog };

export const blogKeys = {
  all: ['blogs'] as const,
  list: (filters: BlogFilters) => [...blogKeys.all, 'list', filters] as const,
  detail: (id: string) => [...blogKeys.all, 'detail', id] as const
};

export const blogsQueryOptions = (filters: BlogFilters) =>
  queryOptions({ queryKey: blogKeys.list(filters), queryFn: () => getBlogs(filters) });

export const blogQueryOptions = (id: string) =>
  queryOptions({ queryKey: blogKeys.detail(id), queryFn: () => getBlog(id) });
