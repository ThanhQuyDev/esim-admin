import { queryOptions } from '@tanstack/react-query';
import { getSiteScripts } from './service';
import type { SiteScript, SiteScriptFilters } from './types';

export type { SiteScript };

export const siteScriptKeys = {
  all: ['site-scripts'] as const,
  list: (filters: SiteScriptFilters) => [...siteScriptKeys.all, 'list', filters] as const,
  detail: (id: string) => [...siteScriptKeys.all, 'detail', id] as const
};

export const siteScriptQueryOptions = (filters: SiteScriptFilters) =>
  queryOptions({ queryKey: siteScriptKeys.list(filters), queryFn: () => getSiteScripts(filters) });
