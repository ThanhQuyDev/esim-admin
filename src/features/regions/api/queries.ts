import { queryOptions } from '@tanstack/react-query';
import { getRegions, getRegion } from './service';
import type { Region, RegionFilters } from './types';

export type { Region };

export const regionKeys = {
  all: ['regions'] as const,
  list: (filters: RegionFilters) => [...regionKeys.all, 'list', filters] as const,
  detail: (id: number) => [...regionKeys.all, 'detail', id] as const
};

export const regionsQueryOptions = (filters: RegionFilters) =>
  queryOptions({
    queryKey: regionKeys.list(filters),
    queryFn: () => getRegions(filters)
  });

export const regionQueryOptions = (id: number) =>
  queryOptions({
    queryKey: regionKeys.detail(id),
    queryFn: () => getRegion(id)
  });
