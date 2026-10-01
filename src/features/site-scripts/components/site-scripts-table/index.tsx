'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { getSortingStateParser } from '@/lib/parsers';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { siteScriptQueryOptions } from '../../api/queries';
import { buildSiteScriptFilters } from '../../utils/site-script-filters';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function SiteScriptsTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters = buildSiteScriptFilters({
    page: params.page,
    perPage: params.perPage,
    name: params.name,
    sort: params.sort
  });

  const { data } = useSuspenseQuery(siteScriptQueryOptions(filters));
  const pageCount = Math.ceil((data.totalCount ?? 0) / params.perPage);
  const { table } = useDataTable({
    data: data.data,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: { columnPinning: { right: ['actions'] } }
  });

  return (
    <DataTable table={table} totalRowCount={data.totalCount}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
