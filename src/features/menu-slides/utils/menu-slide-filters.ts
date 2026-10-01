import type { MenuSlideFilters } from '../api/types';

/**
 * URL params → the filters the menu-slides API takes (#073).
 *
 * One implementation on purpose: the server component prefetches the query and
 * the client reads it back, so if the two built this differently the query keys
 * would not match and the prefetch would be thrown away on every load. The key
 * ORDER matters too — React Query compares keys by value.
 */
export type MenuSlideFilterParams = {
  page: number;
  perPage: number;
  /** The title search box. */
  name?: string | null;
  /** `['product']` etc. from the Menu select box. */
  menuKey?: string[] | null;
  sort?: { id: string; desc: boolean }[];
};

export function buildMenuSlideFilters(params: MenuSlideFilterParams): MenuSlideFilters {
  const apiFilters: Record<string, unknown> = {};
  if (params.name) apiFilters.search = params.name;

  // A select with every option picked is the same as no filter, so only a single
  // choice narrows the list.
  const menuKey = params.menuKey?.length === 1 ? params.menuKey[0] : undefined;

  const apiSort = (params.sort ?? []).map((s) => ({
    orderBy: s.id,
    order: s.desc ? 'DESC' : 'ASC'
  }));

  return {
    page: params.page,
    limit: params.perPage,
    ...(Object.keys(apiFilters).length > 0 && { filters: JSON.stringify(apiFilters) }),
    ...(menuKey && { menuKey }),
    ...(apiSort.length > 0 && { sort: JSON.stringify(apiSort) })
  };
}
