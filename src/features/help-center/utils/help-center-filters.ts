import { getCategoryApiKey, getParentApiKey, type HelpCenterFilters } from '../api/types';

/**
 * URL params → the filters the help-center API takes.
 *
 * One implementation on purpose: the server component prefetches the query and
 * the client component reads it back, so if the two built the filter object
 * differently the query keys would not match and the prefetch would be thrown
 * away on every load. The server side used to send only `search`, so any other
 * filter discarded it (#053).
 */
export type HelpCenterFilterParams = {
  page: number;
  limit: number;
  /** The title search box. */
  name?: string | null;
  category?: string | null;
  parent?: string | null;
  language?: string | null;
  /**
   * `'true'` / `'false'` from the toolbar selects; anything else means "all".
   * `popular` rather than `isPopular`, which is already the array-valued
   * catalogue filter on the destination / region lists.
   */
  popular?: string | null;
  isPublished?: string | null;
  /** Already serialised as the API's `[{orderBy, order}]` JSON, or null. */
  sort?: string | null;
};

/**
 * Column id → the column the API sorts on. Only `name` differs; the rest are
 * named after their column already.
 */
const SORT_ID_TO_API_FIELD: Record<string, string> = {
  name: 'title'
};

/** `[{id, desc}]` from the table → the API's sort JSON, or undefined. */
export function toHelpCenterApiSort(sorting: { id: string; desc: boolean }[]): string | undefined {
  if (!sorting.length) return undefined;
  return JSON.stringify(
    sorting.map((entry) => ({
      orderBy: SORT_ID_TO_API_FIELD[entry.id] ?? entry.id,
      order: entry.desc ? 'DESC' : 'ASC'
    }))
  );
}

/** A Có/Không select only means something when one side is actually picked. */
function boolOf(value: string | null | undefined): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export function buildHelpCenterApiFilters(params: HelpCenterFilterParams): HelpCenterFilters {
  // URL params hold canonical ids so they stay stable when the filter language is
  // toggled; the backend wants the localized kebab-case key.
  const lang = params.language ?? 'en';

  const isPopular = boolOf(params.popular);
  const isPublished = boolOf(params.isPublished);

  return {
    page: params.page,
    limit: params.limit,
    ...(params.name && { search: params.name }),
    ...(params.category && { category: getCategoryApiKey(params.category, lang) }),
    ...(params.parent && { parent: getParentApiKey(params.parent, lang) }),
    ...(params.language && { language: params.language }),
    ...(isPopular !== undefined && { isPopular }),
    // Left out unless picked: the API then shows an admin drafts AND published,
    // which is what this list should default to.
    ...(isPublished !== undefined && { isPublished }),
    // Was never sent at all, so the sortable headers on this table did nothing
    // (#053).
    ...(params.sort && { sort: params.sort })
  };
}
