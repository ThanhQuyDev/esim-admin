'use client';

import { useState, useCallback } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { esimsQueryOptions } from '../../api/queries';
import { exportEsimsExcel } from '../../api/service';
import { ImportEsimExcelDialog } from '../import-esim-excel-dialog';
import { EsimFormDialog } from '../esim-form-dialog';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function EsimsTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const apiFilters: Record<string, unknown> = {};
  if (params.name) apiFilters.search = params.name;

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

  const { data } = useSuspenseQuery(esimsQueryOptions(filters));
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

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportEsimsExcel(filters);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [filters]);

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <Button variant='outline' size='sm' onClick={handleExport} disabled={exporting}>
          {exporting ? <Icons.spinner className='animate-spin' /> : <Icons.download />}
          Export Excel
        </Button>
        <EsimFormDialog />
        <ImportEsimExcelDialog />
      </DataTableToolbar>
    </DataTable>
  );
}

export function EsimsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
