'use client';

import { useMemo } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { apnOptionsQueryOptions, apnSupportQueryOptions } from '../../api/queries';
import { buildApnSupportFilters } from '../../utils/apn-support-filters';
import { buildColumns } from './columns';

export function ApnSupportTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    // Select boxes, keyed by column id (#044, test round 4).
    apn: parseAsArrayOf(parseAsString, ','),
    supports: parseAsArrayOf(parseAsString, ','),
    review: parseAsArrayOf(parseAsString, ',')
  });

  const filters = buildApnSupportFilters({
    page: params.page,
    perPage: params.perPage,
    apn: params.apn,
    supports: params.supports,
    review: params.review
  });

  const { data } = useSuspenseQuery(apnSupportQueryOptions(filters));
  const { data: apnOptions } = useQuery(apnOptionsQueryOptions());
  const pageCount = Math.ceil((data.totalCount ?? 0) / params.perPage);

  const columns = useMemo(
    () =>
      buildColumns({
        apnOptions: (apnOptions ?? []).map((o) => ({ value: o.apn, label: o.apnLabel }))
      }),
    [apnOptions]
  );

  const { table } = useDataTable({
    data: data.data,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      // "supports" exists only to carry the platform filter.
      columnVisibility: { supports: false },
      columnPinning: { right: ['actions'] }
    }
  });

  return (
    <DataTable table={table} totalRowCount={data.totalCount}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
