import { queryOptions } from '@tanstack/react-query';
import { getSeoConfigs, getSeoConfig } from './service';
import type { SeoConfig, SeoConfigFilters } from './types';

export type { SeoConfig };

export const seoConfigKeys = {
  all: ['seo-configs'] as const,
  list: (filters: SeoConfigFilters) => [...seoConfigKeys.all, 'list', filters] as const,
  detail: (id: number) => [...seoConfigKeys.all, 'detail', id] as const
};

export const seoConfigsQueryOptions = (filters: SeoConfigFilters) =>
  queryOptions({
    queryKey: seoConfigKeys.list(filters),
    queryFn: () => getSeoConfigs(filters)
  });

export const seoConfigQueryOptions = (id: number) =>
  queryOptions({
    queryKey: seoConfigKeys.detail(id),
    queryFn: () => getSeoConfig(id)
  });
