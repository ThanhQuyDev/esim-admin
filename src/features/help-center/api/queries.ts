import { queryOptions } from '@tanstack/react-query';
import { getHelpCenterArticles, getHelpCenterArticle } from './service';
import type { HelpCenterArticle, HelpCenterFilters } from './types';

export type { HelpCenterArticle };

export const helpCenterKeys = {
  all: ['help-center'] as const,
  list: (filters: HelpCenterFilters) => [...helpCenterKeys.all, 'list', filters] as const,
  detail: (id: string) => [...helpCenterKeys.all, 'detail', id] as const
};

export const helpCenterQueryOptions = (filters: HelpCenterFilters) =>
  queryOptions({
    queryKey: helpCenterKeys.list(filters),
    queryFn: () => getHelpCenterArticles(filters)
  });

export const helpCenterArticleQueryOptions = (id: string) =>
  queryOptions({ queryKey: helpCenterKeys.detail(id), queryFn: () => getHelpCenterArticle(id) });
