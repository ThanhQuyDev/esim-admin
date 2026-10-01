import { queryOptions } from '@tanstack/react-query';
import { getPlans, getPlan, getPlanApnOptions } from './service';
import type { Plan, PlanFilters } from './types';

export type { Plan };

export const planKeys = {
  all: ['plans'] as const,
  list: (filters: PlanFilters) => [...planKeys.all, 'list', filters] as const,
  detail: (id: number) => [...planKeys.all, 'detail', id] as const,
  apnOptions: () => [...planKeys.all, 'apn-options'] as const
};

/** APN values actually in use, for the filter's select box (#010). */
export const planApnOptionsQueryOptions = () =>
  queryOptions({
    queryKey: planKeys.apnOptions(),
    queryFn: () => getPlanApnOptions(),
    staleTime: 5 * 60_000
  });

export const plansQueryOptions = (filters: PlanFilters) =>
  queryOptions({
    queryKey: planKeys.list(filters),
    queryFn: () => getPlans(filters)
  });

export const planQueryOptions = (id: number) =>
  queryOptions({
    queryKey: planKeys.detail(id),
    queryFn: () => getPlan(id)
  });
