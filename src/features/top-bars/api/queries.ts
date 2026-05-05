import { queryOptions } from '@tanstack/react-query';
import { getTopBars } from './service';
import type { TopBar, TopBarFilters } from './types';

export type { TopBar };

export const topBarKeys = {
  all: ['top-bars'] as const,
  list: (filters: TopBarFilters) => [...topBarKeys.all, 'list', filters] as const,
  detail: (id: string) => [...topBarKeys.all, 'detail', id] as const
};

export const topBarQueryOptions = (filters: TopBarFilters) =>
  queryOptions({ queryKey: topBarKeys.list(filters), queryFn: () => getTopBars(filters) });
