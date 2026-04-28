import { queryOptions } from '@tanstack/react-query';
import { getMiniTags, getMiniTag } from './service';
import type { MiniTagFilters } from './types';

export const miniTagKeys = {
  all: ['mini-tags'] as const,
  list: (filters: MiniTagFilters) => [...miniTagKeys.all, 'list', filters] as const,
  detail: (id: number) => [...miniTagKeys.all, 'detail', id] as const
};

export const miniTagsQueryOptions = (filters: MiniTagFilters) =>
  queryOptions({
    queryKey: miniTagKeys.list(filters),
    queryFn: () => getMiniTags(filters)
  });

export const miniTagQueryOptions = (id: number) =>
  queryOptions({
    queryKey: miniTagKeys.detail(id),
    queryFn: () => getMiniTag(id)
  });
