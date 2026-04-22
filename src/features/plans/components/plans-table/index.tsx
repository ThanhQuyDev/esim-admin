'use client';

import { useMemo } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { plansQueryOptions } from '../../api/queries';
import { columns } from './columns';
import { BatchDiscountDialog } from '../batch-discount-dialog';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function PlansTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    isCheapest: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const apiFilters: Record<string, unknown> = {};
  if (params.name) apiFilters.search = params.name;
  if (params.isCheapest) apiFilters.isCheapest = params.isCheapest === 'true';

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

  const { data } = useSuspenseQuery(plansQueryOptions(filters));

  const { table } = useDataTable({
    data: data.data,
    columns,
    pageCount: -1,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  const selectedIds = useMemo(() => {
    return table.getSelectedRowModel().rows.map((row) => row.original.id);
  }, [table.getSelectedRowModel().rows]);

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <BatchDiscountDialog
          selectedIds={selectedIds}
          onSuccess={() => table.resetRowSelection()}
        />
      </DataTableToolbar>
    </DataTable>
  );
}

export function PlansTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
