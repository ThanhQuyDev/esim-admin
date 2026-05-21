'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsString, useQueryStates } from 'nuqs';
import { supportedDevicesQueryOptions } from '../../api/queries';
import { columns } from './columns';

export function SupportedDevicesTable() {
  const [params] = useQueryStates({
    name: parseAsString
  });

  const filters = {
    ...(params.name && { search: params.name })
  };

  const { data } = useSuspenseQuery(supportedDevicesQueryOptions(filters));

  const { table } = useDataTable({
    data,
    columns,
    pageCount: -1,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function SupportedDevicesTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
