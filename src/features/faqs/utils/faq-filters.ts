/**
 * URL params → the `filters` object the FAQ API takes.
 *
 * One implementation on purpose: the server component prefetches the query and
 * the client component reads it back, so if the two built the filter object
 * differently the query keys would not match and the prefetch would be thrown
 * away on every load (#050).
 */
export type FaqFilterParams = {
  /** The question / url search box. */
  name?: string | null;
  /** `['true']` / `['false']` from the select box. */
  isActive?: string[] | null;
};

export function buildFaqApiFilters(params: FaqFilterParams): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (params.name) filters.search = params.name;

  // A Hoạt động/Không select only means something when one side is picked; both
  // selected is the same as no filter.
  if (params.isActive?.length === 1) {
    filters.isActive = params.isActive[0] === 'true';
  }

  return filters;
}
