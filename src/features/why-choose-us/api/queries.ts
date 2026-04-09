import { queryOptions } from '@tanstack/react-query';
import { getWhyChooseUs } from './service';
import type { WhyChooseUs, WhyChooseUsFilters } from './types';

export type { WhyChooseUs };

export const wcuKeys = {
  all: ['why-choose-us'] as const,
  list: (filters: WhyChooseUsFilters) => [...wcuKeys.all, 'list', filters] as const,
  detail: (id: number) => [...wcuKeys.all, 'detail', id] as const
};

export const wcuQueryOptions = (filters: WhyChooseUsFilters) =>
  queryOptions({ queryKey: wcuKeys.list(filters), queryFn: () => getWhyChooseUs(filters) });
