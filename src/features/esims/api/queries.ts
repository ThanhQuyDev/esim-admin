import { queryOptions } from '@tanstack/react-query';
import { getEsims, getEsim } from './service';
import type { Esim, EsimDetail, EsimFilters } from './types';

export type { Esim, EsimDetail };

export const esimKeys = {
  all: ['esims'] as const,
  list: (filters: EsimFilters) => [...esimKeys.all, 'list', filters] as const,
  detail: (id: number) => [...esimKeys.all, 'detail', id] as const
};

export const esimsQueryOptions = (filters: EsimFilters) =>
  queryOptions({
    queryKey: esimKeys.list(filters),
    // A page nobody waits for any more is dropped (vande-0411 #054).
    queryFn: ({ signal }) => getEsims(filters, signal)
  });

export const esimQueryOptions = (id: number) =>
  queryOptions({
    queryKey: esimKeys.detail(id),
    queryFn: () => getEsim(id)
  });
