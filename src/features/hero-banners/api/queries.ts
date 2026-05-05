import { queryOptions } from '@tanstack/react-query';
import { getHeroBanners } from './service';
import type { HeroBanner, HeroBannerFilters } from './types';

export type { HeroBanner };

export const heroBannerKeys = {
  all: ['hero-banners'] as const,
  list: (filters: HeroBannerFilters) => [...heroBannerKeys.all, 'list', filters] as const,
  detail: (id: string) => [...heroBannerKeys.all, 'detail', id] as const
};

export const heroBannerQueryOptions = (filters: HeroBannerFilters) =>
  queryOptions({ queryKey: heroBannerKeys.list(filters), queryFn: () => getHeroBanners(filters) });
