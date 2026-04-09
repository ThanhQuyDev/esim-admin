import { queryOptions } from '@tanstack/react-query';
import { getPlans, getPlan } from './service';
import type { Plan, PlanFilters } from './types';

export type { Plan };

export const planKeys = {
  all: ['plans'] as const,
  list: (filters: PlanFilters) => [...planKeys.all, 'list', filters] as const,
  detail: (id: number) => [...planKeys.all, 'detail', id] as const
};

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
