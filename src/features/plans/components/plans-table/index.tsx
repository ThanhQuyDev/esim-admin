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
import { planApnOptionsQueryOptions, plansQueryOptions } from '../../api/queries';
import { destinationsQueryOptions } from '@/features/destinations/api/queries';
import { regionsQueryOptions } from '@/features/regions/api/queries';
import { exportPlansExcel } from '../../api/service';
import { buildPlanApiFilters } from '../../utils/plan-filters';
import { buildColumns, columns } from './columns';
import { BatchDiscountDialog } from '../batch-discount-dialog';
import { locationKeywords, locationLabel } from '../../utils/location-options';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

/** Enough to cover the whole catalogue; both lists are small and cached. */
const OPTIONS_LIMIT = 500;

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
    // Now a list of `d:<id>` / `r:<id>` picked from a select box (#010).
    country: parseAsArrayOf(parseAsString, ','),
    hasCallSms: parseAsArrayOf(parseAsString, ','),
    apn: parseAsArrayOf(parseAsString, ','),
    isNonHkIp: parseAsArrayOf(parseAsString, ','),
    topUp: parseAsArrayOf(parseAsString, ','),
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  // Same mapping the server used to prefetch, so the query keys match.
  const apiFilters = buildPlanApiFilters(params);

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

  // Filter option lists (#010). Cached and shared with the other screens that
  // already load them.
  const { data: apnValues } = useSuspenseQuery(planApnOptionsQueryOptions());
  const { data: destinationsData } = useSuspenseQuery(
    destinationsQueryOptions({ page: 1, limit: OPTIONS_LIMIT })
  );
  const { data: regionsData } = useSuspenseQuery(
    regionsQueryOptions({ page: 1, limit: OPTIONS_LIMIT })
  );

  const tableColumns = useMemo(
    () =>
      buildColumns({
        apnOptions: apnValues.map((apn) => ({ value: apn, label: apn })),
        locationOptions: [
          // Vietnamese name first, searchable in either language (#018).
          ...regionsData.data.map((region) => ({
            value: `r:${region.id}`,
            label: `Khu vực: ${locationLabel(region)}`,
            keywords: locationKeywords(region)
          })),
          ...destinationsData.data.map((destination) => ({
            value: `d:${destination.id}`,
            label: locationLabel(destination),
            keywords: locationKeywords(destination)
          }))
        ]
      }),
    [apnValues, destinationsData.data, regionsData.data]
  );

  const { table } = useDataTable({
    data: responseData.data,
    columns: tableColumns,
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
