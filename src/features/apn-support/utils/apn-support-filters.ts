import type { ApnSupportFilters } from '../api/types';

/**
 * URL params → the filters the APN API takes (#065, #044).
 *
 * One implementation on purpose: the server component prefetches the query and the
 * client reads it back, so building this differently in the two places would make
 * the query keys disagree and throw the prefetch away on every load. The key ORDER
 * matters too — React Query compares keys by value.
 *
 * The old free-text "name" box was sent as `filters={search}`, which the API never
 * read; it is replaced by the APN select box (#044, test round 4).
 */
export type ApnSupportFilterParams = {
  page: number;
  perPage: number;
  /** APNs picked in the select box. */
  apn?: string[] | null;
  /** Platforms that must be supported. */
  supports?: string[] | null;
  /** `['true']` = chưa có thông tin, `['false']` = đã điền. */
  review?: string[] | null;
};

export function buildApnSupportFilters(params: ApnSupportFilterParams): ApnSupportFilters {
  return {
    page: params.page,
    limit: params.perPage,
    ...(params.apn?.length && { apns: params.apn.join(',') }),
    ...(params.supports?.length && { supports: params.supports.join(',') }),
    ...(params.review?.length === 1 && { needsReview: params.review[0] === 'true' })
  };
}
