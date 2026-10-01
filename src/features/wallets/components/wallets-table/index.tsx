'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { walletsQueryOptions } from '../../api/queries';
import { buildWalletApiFilters } from '../../utils/wallet-filters';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function WalletsTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    // Customer code / name / tier filters (#057), keyed by column id.
    customerCode: parseAsString,
    customerName: parseAsString,
    membershipTier: parseAsArrayOf(parseAsString, ','),
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const apiSort = params.sort.map((s) => ({
    orderBy: s.id,
    order: s.desc ? 'DESC' : 'ASC'
  }));

  const filters = buildWalletApiFilters({
    ...params,
    limit: params.perPage,
    sort: apiSort.length > 0 ? JSON.stringify(apiSort) : undefined
  });

  const { data } = useSuspenseQuery(walletsQueryOptions(filters));
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
    <DataTable table={table} totalRowCount={data.totalCount}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function WalletsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
