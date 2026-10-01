/**
 * URL params → the `filters` object the users API takes.
 *
 * One implementation on purpose: the server component prefetches the query and
 * the client component reads it back, so if the two built the filter object
 * differently the query keys would not match and the prefetch would be thrown
 * away on every load. They had already drifted — the server never sent `search`
 * at all — which is why this exists rather than two inline copies (#037).
 */
export type UserFilterParams = {
  name?: string | null;
  customerCode?: string | null;
  membershipTier?: string[] | null;
  userStatus?: string[] | null;
};

export function buildUserApiFilters(params: UserFilterParams): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (params.name) filters.search = params.name;

  // Sent as typed; the backend keeps only the digits, so `KH-000123`, `kh000123`
  // and `123` all find customer 123.
  if (params.customerCode?.trim()) filters.customerCode = params.customerCode.trim();

  if (params.membershipTier?.length) filters.membershipTiers = params.membershipTier;

  if (params.userStatus?.length) {
    const ids = params.userStatus.map((value) => Number(value)).filter(Number.isInteger);
    if (ids.length) filters.statusIds = ids;
  }

  return filters;
}
