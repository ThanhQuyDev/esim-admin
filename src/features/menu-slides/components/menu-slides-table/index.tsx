'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { getSortingStateParser } from '@/lib/parsers';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { menuSlideQueryOptions } from '../../api/queries';
import { buildMenuSlideFilters } from '../../utils/menu-slide-filters';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function MenuSlidesTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    // Keyed by column id, which is how useDataTable writes filter params.
    menuKey: parseAsArrayOf(parseAsString, ','),
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters = buildMenuSlideFilters({
    page: params.page,
    perPage: params.perPage,
    name: params.name,
    menuKey: params.menuKey,
    sort: params.sort
  });

  const { data } = useSuspenseQuery(menuSlideQueryOptions(filters));
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
