'use client';

import { useMemo, useState, useCallback } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { plansQueryOptions } from '../../api/queries';
import { exportPlansExcel } from '../../api/service';
import { columns } from './columns';
import { BatchDiscountDialog } from '../batch-discount-dialog';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function PlansTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    provider: parseAsArrayOf(parseAsString, ','),
    isCheapest: parseAsArrayOf(parseAsString, ','),
    isActive: parseAsArrayOf(parseAsString, ','),
    type: parseAsArrayOf(parseAsString, ','),
    tags: parseAsArrayOf(parseAsString, ','),
    duration: parseAsString,
    data: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const apiFilters: Record<string, unknown> = {};
  if (params.name) apiFilters.search = params.name;
  if (params.provider && params.provider.length > 0) {
    apiFilters.provider = params.provider;
  }
  if (params.isCheapest && params.isCheapest.length === 1) {
    apiFilters.isCheapest = params.isCheapest[0] === 'true';
  }
  if (params.isActive && params.isActive.length === 1) {
    apiFilters.isActive = params.isActive[0] === 'true';
  }
  if (params.type && params.type.length > 0) {
    apiFilters.type = params.type.length === 1 ? params.type[0] : params.type;
  }
  if (params.tags && params.tags.length > 0) {
    apiFilters.tags = params.tags;
  }
  if (params.duration) {
    const durationNum = Number(params.duration);
    if (!isNaN(durationNum)) apiFilters.duration = durationNum;
  }
  if (params.data) {
    apiFilters.data = params.data;
  }

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

  const { data: responseData } = useSuspenseQuery(plansQueryOptions(filters));
  const pageCount = Math.ceil((responseData.totalCount ?? 0) / params.perPage);

  const { table } = useDataTable({
    data: responseData.data,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  const selectedIds = useMemo(() => {
    return table.getSelectedRowModel().rows.map((row) => row.original.id);
  }, [table.getSelectedRowModel().rows]);

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportPlansExcel(filters);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [filters]);

  return (
    <DataTable table={table} totalRowCount={responseData.totalCount}>
      <DataTableToolbar table={table}>
        <Button variant='outline' size='sm' onClick={handleExport} disabled={exporting}>
          {exporting ? <Icons.spinner className='animate-spin' /> : <Icons.download />}
          Export Excel
        </Button>
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
