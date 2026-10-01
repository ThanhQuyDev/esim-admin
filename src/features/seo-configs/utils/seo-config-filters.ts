/**
 * URL params → the `filters` object the SEO config API takes.
 *
 * One implementation on purpose: the server component prefetches the query and
 * the client component reads it back, so if the two built the filter object
 * differently the query keys would not match and the prefetch would be thrown
 * away on every load (#048).
 */
export type SeoConfigFilterParams = {
  /** URL search box. */
  name?: string | null;
  pageType?: string[] | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  /** `['true']` / `['false']` from the select box (#048). */
  isActive?: string[] | null;
};

export function buildSeoConfigApiFilters(params: SeoConfigFilterParams): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (params.name) filters.search = params.name;
  // The API matches a single page type per request, so only the first
  // selection is sent.
  if (params.pageType?.[0]) filters.pageType = params.pageType[0];

  if (params.metaTitle?.trim()) filters.metaTitle = params.metaTitle.trim();
  if (params.metaDescription?.trim()) {
    filters.metaDescription = params.metaDescription.trim();
  }

  // A Hoạt động/Tắt select only means something when one side is picked; both
  // selected is the same as no filter.
  if (params.isActive?.length === 1) {
    filters.isActive = params.isActive[0] === 'true';
  }

  return filters;
}
