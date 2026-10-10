import { queryOptions } from '@tanstack/react-query';
import { getApnOptions, getApnSupport } from './service';
import type { ApnSupportFilters } from './types';

export const apnSupportKeys = {
  all: ['apn-support'] as const,
  list: (filters: ApnSupportFilters) => [...apnSupportKeys.all, 'list', filters] as const,
  options: () => [...apnSupportKeys.all, 'options'] as const
};

export const apnSupportQueryOptions = (filters: ApnSupportFilters) =>
  queryOptions({
    queryKey: apnSupportKeys.list(filters),
    queryFn: () => getApnSupport(filters)
  });

/** APN names for the filter's select box (#044). */
export const apnOptionsQueryOptions = () =>
  queryOptions({
    queryKey: apnSupportKeys.options(),
    queryFn: () => getApnOptions(),
    staleTime: 60 * 1000
  });
