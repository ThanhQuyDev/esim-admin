'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataTable } from '@/hooks/use-data-table';
import { getSortingStateParser } from '@/lib/parsers';
import { ticketsQueryOptions } from '../../api/queries';
import { columns } from './columns';
import type { TicketStatus } from '../../api/types';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function TicketsTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString,
    status: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status as TicketStatus })
  };

  const { data } = useSuspenseQuery(ticketsQueryOptions(filters));

  // Backend gives hasNextPage instead of totalCount.
  // pageCount: if more pages exist, allow advancing one more; otherwise lock to current page.
  const pageCount =
    typeof data.totalCount === 'number'
      ? Math.max(1, Math.ceil(data.totalCount / params.perPage))
      : data.hasNextPage
        ? params.page + 1
        : Math.max(1, params.page);

  const { table } = useDataTable({
    data: data.data,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 400,
    initialState: {
      columnPinning: { right: ['actions'] },
      sorting: [{ id: 'createdAt', desc: true }]
    }
  });

  return (
    <DataTable table={table} totalRowCount={data.totalCount}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function TicketsTableSkeleton() {
  return (
    <div className='space-y-4 p-1'>
      <div className='flex items-center justify-between gap-2'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-8 w-32' />
      </div>
      <Skeleton className='h-[480px] w-full' />
    </div>
  );
}
