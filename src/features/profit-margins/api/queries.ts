import { queryOptions } from '@tanstack/react-query';
import { getProfitMarginTiers } from './service';
import type { ProfitMarginTier, ProfitMarginTierFilters } from './types';

export type { ProfitMarginTier };

export const profitMarginTierKeys = {
  all: ['profit-margin-tiers'] as const,
  list: (filters: ProfitMarginTierFilters) =>
    [...profitMarginTierKeys.all, 'list', filters] as const,
  detail: (id: number) => [...profitMarginTierKeys.all, 'detail', id] as const
};

export const profitMarginTierQueryOptions = (filters: ProfitMarginTierFilters) =>
  queryOptions({
    queryKey: profitMarginTierKeys.list(filters),
    queryFn: () => getProfitMarginTiers(filters)
  });
