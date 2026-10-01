import type { WhyChooseUsFilters } from '../api/types';

/**
 * URL params → the filters the "Tại sao chọn chúng tôi" API takes.
 *
 * One implementation on purpose: the server component prefetches the query and
 * the client component reads it back, so if the two built the filter object
 * differently the query keys would not match and the prefetch would be thrown
 * away on every load (#054).
 */
export type WcuFilterParams = {
  page: number;
  limit: number;
  /** The title / content / page search box. */
  name?: string | null;
  /** Selected page types, from the multi-select. */
  type?: string[] | null;
  /** `['true']` / `['false']` from the status select. */
  isActive?: string[] | null;
  /** Already serialised as the API's `[{orderBy, order}]` JSON, or undefined. */
  sort?: string;
};

export function buildWcuApiFilters(params: WcuFilterParams): WhyChooseUsFilters {
  return {
    page: params.page,
    limit: params.limit,
    ...(params.name && { search: params.name }),
    // Every selected page type; the API returns rows matching any of them, and a
    // row can itself belong to several pages.
    ...(params.type?.length && { type: params.type.join(',') }),
    // A Hoạt động/Không select only means something when one side is picked; both
    // selected is the same as no filter.
    ...(params.isActive?.length === 1 && {
      isActive: params.isActive[0] === 'true'
    }),
    ...(params.sort && { sort: params.sort })
  };
}
