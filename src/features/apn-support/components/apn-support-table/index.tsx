'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { getSortingStateParser } from '@/lib/parsers';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { apnSupportQueryOptions } from '../../api/queries';
import { buildApnSupportFilters } from '../../utils/apn-support-filters';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function ApnSupportTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters = buildApnSupportFilters({
    page: params.page,
    perPage: params.perPage,
    name: params.name,
    sort: params.sort
  });

  const { data } = useSuspenseQuery(apnSupportQueryOptions(filters));
  const pageCount = Math.ceil((data.totalCount ?? 0) / params.perPage);
  const { table } = useDataTable({
    data: data.data,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500
  });

  return (
    <DataTable table={table} totalRowCount={data.totalCount}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
