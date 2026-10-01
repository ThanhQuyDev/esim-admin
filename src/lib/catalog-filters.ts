import { OVERVIEW_PROVIDERS, PROVIDER_LABELS } from '@/features/overview/api/constants';

/**
 * Filter plumbing shared by the two catalogue lists — Điểm đến and Khu vực
 * (#034, #036). They take the same four filters and the same API shape, so the
 * options and the builder live here rather than in two copies that drift.
 *
 * One builder on purpose: each list's server component prefetches the query and
 * its client component reads it back, so if the two built the filter object
 * differently the query keys would not match and the prefetch would be thrown
 * away on every load — the drift that had to be fixed in plans (#010), orders
 * (#017) and eSIMs (#020).
 */

export const YES_NO_OPTIONS = [
  { value: 'true', label: 'Có' },
  { value: 'false', label: 'Không' }
];

export const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Hoạt động' },
  { value: 'false', label: 'Không hoạt động' }
];

/**
 * Built from the shared supplier list rather than spelled out again, so adding a
 * supplier in one place reaches both filters.
 */
export const PROVIDER_OPTIONS = OVERVIEW_PROVIDERS.map((provider) => ({
  value: provider,
  label: PROVIDER_LABELS[provider] ?? provider
}));

export type CatalogFilterParams = {
  name?: string | null;
  isPopular?: string[] | null;
  isActive?: string[] | null;
  providers?: string[] | null;
};

/** A Có/Không select only means something when exactly one side is picked. */
function boolOf(values: string[] | null | undefined): boolean | undefined {
  return values && values.length === 1 ? values[0] === 'true' : undefined;
}

/**
 * Both spellings of a supplier, because the `providers` column is free text: an
 * admin may have typed `airalo` or `Airalo`. The backend matches each entry as a
 * case-insensitive substring, so sending both costs nothing and catches both.
 */
function providerTokens(slugs: string[]): string[] {
  const tokens = new Set<string>();
  for (const slug of slugs) {
    tokens.add(slug);
    const label = PROVIDER_LABELS[slug];
    if (label) tokens.add(label);
  }
  return [...tokens];
}

export function buildCatalogApiFilters(params: CatalogFilterParams): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (params.name) filters.search = params.name;

  const isPopular = boolOf(params.isPopular);
  if (isPopular !== undefined) filters.isPopular = isPopular;

  const isActive = boolOf(params.isActive);
  if (isActive !== undefined) filters.isActive = isActive;

  if (params.providers?.length) filters.providers = providerTokens(params.providers);

  return filters;
}
