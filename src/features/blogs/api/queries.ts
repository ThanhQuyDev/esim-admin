import { queryOptions } from '@tanstack/react-query';
import {
  getBlogs,
  getBlog,
  getBlogCategoryTree,
  getBlogCategoryCatalogue,
  getBlogAuthorOptions,
  getBlogAuthorProfiles
} from './service';
import type { Blog, BlogFilters } from './types';

export type { Blog };

export const blogKeys = {
  all: ['blogs'] as const,
  list: (filters: BlogFilters) => [...blogKeys.all, 'list', filters] as const,
  detail: (id: string) => [...blogKeys.all, 'detail', id] as const,
  categoryTree: () => [...blogKeys.all, 'category-tree'] as const,
  categoryCatalogue: () => [...blogKeys.all, 'category-catalogue'] as const,
  authorOptions: () => [...blogKeys.all, 'author-options'] as const,
  authorProfiles: () => [...blogKeys.all, 'author-profiles'] as const
};

/** Categories and their sub-categories, for the list filter (#054). */
export const blogCategoryTreeQueryOptions = () =>
  queryOptions({
    queryKey: blogKeys.categoryTree(),
    queryFn: () => getBlogCategoryTree(),
    staleTime: 5 * 60 * 1000
  });

/** The made-in-advance categories for the post form (vande #076). */
export const blogCategoryCatalogueQueryOptions = () =>
  queryOptions({
    queryKey: blogKeys.categoryCatalogue(),
    queryFn: () => getBlogCategoryCatalogue(),
    staleTime: 5 * 60 * 1000
  });

/** Authors that have articles, for the list filter (#046). */
export const blogAuthorOptionsQueryOptions = () =>
  queryOptions({
    queryKey: blogKeys.authorOptions(),
    queryFn: () => getBlogAuthorOptions(),
    staleTime: 5 * 60 * 1000
  });

/** Every author profile, for the admin's "Tác giả" select box (#011). */
export const blogAuthorProfilesQueryOptions = () =>
  queryOptions({
    queryKey: blogKeys.authorProfiles(),
    queryFn: () => getBlogAuthorProfiles(),
    staleTime: 5 * 60 * 1000
  });

export const blogsQueryOptions = (filters: BlogFilters) =>
  queryOptions({ queryKey: blogKeys.list(filters), queryFn: () => getBlogs(filters) });

export const blogQueryOptions = (id: string) =>
  queryOptions({ queryKey: blogKeys.detail(id), queryFn: () => getBlog(id) });
