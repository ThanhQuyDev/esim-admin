'use client';

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { buildEsimApiFilters } from '../../utils/esim-filters';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

/**
 * The eSIM list's filters, read from the URL. Shared by the table and the
 * "Export Excel" button, which now sits in the page header (vande-1411 #044)
 * and still exports what the table shows.
 */
export function useEsimListFilters() {
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    planName: parseAsString,
    // #020
    packageType: parseAsArrayOf(parseAsString, ','),
    // Named after the column id — see the note on that column.
    esimStatus: parseAsArrayOf(parseAsString, ','),
    provider: parseAsArrayOf(parseAsString, ','),
    hasCallSms: parseAsArrayOf(parseAsString, ','),
    topUp: parseAsArrayOf(parseAsString, ','),
    createdFrom: parseAsString,
    createdTo: parseAsString,
    expiresFrom: parseAsString,
    expiresTo: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  // Same mapping the server used to prefetch, so the query keys match.
  const apiFilters = buildEsimApiFilters({ ...params, status: params.esimStatus });

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
