'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { ordersQueryOptions } from '../../api/queries';
import { columns } from './columns';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function OrdersTable() {
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    iccid: parseAsString,
    planName: parseAsString,
    status: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const apiFilters: Record<string, unknown> = {};
  if (params.name) apiFilters.search = params.name;
  if (params.iccid) apiFilters.iccid = params.iccid;
  if (params.planName) apiFilters.planName = params.planName;
  if (params.status) apiFilters.status = params.status;

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

  const { data } = useSuspenseQuery(ordersQueryOptions(filters));
  const pageCount = Math.ceil((data.totalCount ?? 0) / params.perPage);

  const { table } = useDataTable({
    data: data.data,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      {/* Advanced Filters */}
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative w-56'>
          <Icons.search className='text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4' />
          <Input
            placeholder='Tìm theo ICCID...'
            value={params.iccid ?? ''}
            onChange={(e) => setParams({ iccid: e.target.value || null, page: 1 })}
            className='pl-8'
          />
        </div>
        <div className='relative w-56'>
          <Icons.search className='text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4' />
          <Input
            placeholder='Tìm theo tên gói cước...'
            value={params.planName ?? ''}
            onChange={(e) => setParams({ planName: e.target.value || null, page: 1 })}
            className='pl-8'
          />
        </div>
      </div>

      <DataTable table={table} totalRowCount={data.totalCount}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}

export function OrdersTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
