import { queryOptions } from '@tanstack/react-query';
import { getFooters } from './service';
import type { Footer, FooterFilters } from './types';

export type { Footer };

export const footerKeys = {
  all: ['footers'] as const,
  list: (filters: FooterFilters) => [...footerKeys.all, 'list', filters] as const,
  detail: (id: string) => [...footerKeys.all, 'detail', id] as const
};

export const footerQueryOptions = (filters: FooterFilters) =>
  queryOptions({ queryKey: footerKeys.list(filters), queryFn: () => getFooters(filters) });
