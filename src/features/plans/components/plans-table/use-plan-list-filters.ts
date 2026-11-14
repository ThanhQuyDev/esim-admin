'use client';

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { buildPlanApiFilters } from '../../utils/plan-filters';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

/**
 * The plan list's filters, read from the URL. Shared by the table and the
 * "Export Excel" button, which now sits in the page header (vande-1411 #044)
 * and still exports what the table shows.
 */
export function usePlanListFilters() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    providerName: parseAsString,
    provider: parseAsArrayOf(parseAsString, ','),
    isCheapest: parseAsArrayOf(parseAsString, ','),
    isActive: parseAsArrayOf(parseAsString, ','),
    type: parseAsArrayOf(parseAsString, ','),
    tags: parseAsArrayOf(parseAsString, ','),
    duration: parseAsString,
    data: parseAsString,
    // Now a list of `d:<id>` / `r:<id>` picked from a select box (#010).
    country: parseAsArrayOf(parseAsString, ','),
    hasCallSms: parseAsArrayOf(parseAsString, ','),
    apn: parseAsArrayOf(parseAsString, ','),
    isNonHkIp: parseAsArrayOf(parseAsString, ','),
    topUp: parseAsArrayOf(parseAsString, ','),
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  // Same mapping the server used to prefetch, so the query keys match.
  const apiFilters = buildPlanApiFilters(params);

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

  return { params, apiFilters, filters };
}
