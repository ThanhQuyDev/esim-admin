import type { WalletFilters } from '../api/types';

/**
 * URL params → the filters the admin wallet list takes.
 *
 * One implementation on purpose: the server component prefetches the query and
 * the client component reads it back, so if the two built the filter object
 * differently the query keys would not match and the prefetch would be thrown
 * away on every load (#057).
 */
export type WalletFilterParams = {
  page: number;
  limit: number;
  /** The email search box. */
  name?: string | null;
  customerCode?: string | null;
  customerName?: string | null;
  /** Selected tiers, from the multi-select. */
  membershipTier?: string[] | null;
  /** Already serialised as the API's `[{orderBy, order}]` JSON, or undefined. */
  sort?: string;
};

export function buildWalletApiFilters(params: WalletFilterParams): WalletFilters {
  return {
    page: params.page,
    limit: params.limit,
    ...(params.name && { email: params.name }),
    // Sent as typed; the backend keeps only the digits, so `KH-000123` and `123`
    // both find customer 123.
    ...(params.customerCode?.trim() && { customerCode: params.customerCode.trim() }),
    ...(params.customerName?.trim() && { customerName: params.customerName.trim() }),
    ...(params.membershipTier?.length && {
      membershipTiers: params.membershipTier.join(',')
    }),
    ...(params.sort && { sort: params.sort })
  };
}
