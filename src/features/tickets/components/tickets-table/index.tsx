'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableViewOptions } from '@/components/ui/table/data-table-view-options';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TICKETS_VIEW_OPTIONS_SLOT } from '../tickets-filter-bar';
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

  // "Hiển thị" on the search's row (vande-1411 #044); the table has no
  // column filters of its own, so its toolbar row held only that button.
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(document.getElementById(TICKETS_VIEW_OPTIONS_SLOT)), []);

  return (
    <DataTable table={table} totalRowCount={data.totalCount}>
      {slot && createPortal(<DataTableViewOptions table={table} />, slot)}
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
