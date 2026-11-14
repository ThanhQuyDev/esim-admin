'use client';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { DEFAULT_ORDER_STATUS, buildOrderApiFilters } from '../../utils/order-filters';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

/** What "Đặt lại" sets: every filter off, the status back to its default. */
export const CLEARED_ORDER_FILTERS = {
  q: null,
  orderNumber: null,
  userEmail: null,
  iccid: null,
  planName: null,
  status: DEFAULT_ORDER_STATUS,
  invoice: null,
  kind: null,
  partner: null,
  usd: null,
  esimError: null,
  createdFrom: null,
  createdTo: null,
  page: 1
};

/** Any filter other than the default view (vande-1411 #044). */
export function hasOrderFilters(params: Record<string, unknown>): boolean {
  return Object.entries(CLEARED_ORDER_FILTERS).some(
    ([key, cleared]) => key !== 'page' && (params[key] ?? null) !== cleared
  );
}

/**
 * The order list's filters, read from the URL. Shared by the table and the
 * "Xuất Excel đối soát" button, which now sits in the page header beside
 * "Đặt eSIM hàng loạt" (vande-1411 #044) and still exports what the table shows.
 */
export function useOrderListFilters() {
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    q: parseAsString,
    orderNumber: parseAsString,
    userEmail: parseAsString,
    iccid: parseAsString,
    planName: parseAsString,
    // Paid by default (#017): an admin opening this page is looking at real
    // sales, not at abandoned checkouts. `all` is an explicit choice, which is
    // why the default is a real value rather than null.
    status: parseAsString.withDefault(DEFAULT_ORDER_STATUS),
    invoice: parseAsString,
    kind: parseAsString,
    partner: parseAsString,
    usd: parseAsString,
    esimError: parseAsString,
    createdFrom: parseAsString,
    createdTo: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  // Same mapping the server used to prefetch, so the query keys match.
  // Also applied to the Excel export, so the sheet matches the screen.
  const apiFilters = buildOrderApiFilters(params);

  const apiSort = params.sort.map((s) => ({
    orderBy: s.id,
    order: s.desc ? 'DESC' : 'ASC'
  }));

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(Object.keys(apiFilters).length > 0 && {
      filters: JSON.stringify(apiFilters)
    }),
    ...(apiSort.length > 0 && { sort: JSON.stringify(apiSort) })
  };

  return { params, setParams, apiFilters, filters };
}
