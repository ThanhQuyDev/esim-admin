import type { SiteScriptFilters } from '../api/types';

/**
 * URL params → the filters the site-scripts API takes (#075).
 *
 * One implementation on purpose: the server component prefetches the query and
 * the client reads it back, so building this differently in the two places would
 * make the query keys disagree and throw the prefetch away on every load. The key
 * ORDER matters too — React Query compares keys by value.
 */
export type SiteScriptFilterParams = {
  page: number;
  perPage: number;
  name?: string | null;
  sort?: { id: string; desc: boolean }[];
};

export function buildSiteScriptFilters(params: SiteScriptFilterParams): SiteScriptFilters {
  const apiFilters: Record<string, unknown> = {};
  if (params.name) apiFilters.search = params.name;

  const apiSort = (params.sort ?? []).map((s) => ({
    orderBy: s.id,
    order: s.desc ? 'DESC' : 'ASC'
  }));

  return {
    page: params.page,
    limit: params.perPage,
    ...(Object.keys(apiFilters).length > 0 && { filters: JSON.stringify(apiFilters) }),
    ...(apiSort.length > 0 && { sort: JSON.stringify(apiSort) })
  };
}
