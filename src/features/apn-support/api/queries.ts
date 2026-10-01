import { queryOptions } from '@tanstack/react-query';
import { getApnSupport } from './service';
import type { ApnSupportFilters } from './types';

export const apnSupportKeys = {
  all: ['apn-support'] as const,
  list: (filters: ApnSupportFilters) => [...apnSupportKeys.all, 'list', filters] as const
};

export const apnSupportQueryOptions = (filters: ApnSupportFilters) =>
  queryOptions({
    queryKey: apnSupportKeys.list(filters),
    queryFn: () => getApnSupport(filters)
  });
