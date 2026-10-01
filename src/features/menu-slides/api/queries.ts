import { queryOptions } from '@tanstack/react-query';
import { getMenuSlides } from './service';
import type { MenuSlide, MenuSlideFilters } from './types';

export type { MenuSlide };

export const menuSlideKeys = {
  all: ['menu-slides'] as const,
  list: (filters: MenuSlideFilters) => [...menuSlideKeys.all, 'list', filters] as const,
  detail: (id: string) => [...menuSlideKeys.all, 'detail', id] as const
};

export const menuSlideQueryOptions = (filters: MenuSlideFilters) =>
  queryOptions({ queryKey: menuSlideKeys.list(filters), queryFn: () => getMenuSlides(filters) });
