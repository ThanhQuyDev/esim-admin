'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useMemo } from 'react';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { partnersQueryOptions, tiersQueryOptions } from '../../api/queries';
import type { PartnerStatus, PartnerType } from '../../api/types';
import { partnerColumns } from './columns';

export function PartnersTable() {
  // Every filter the brief asks for (#058). They live in the URL, so a filtered
  // list is a link an admin can send to a colleague or come back to.
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    partnerType: parseAsString,
    status: parseAsString,
    tierCode: parseAsString
  });

  // The tier list comes from the programme's own tiers rather than a hardcoded
  // set, so renaming or adding one needs no change here.
  const { data: tiers = [] } = useQuery(tiersQueryOptions());
  const tierCodes = useMemo(
    () => [...new Set(tiers.map((tier) => tier.tierCode))].toSorted(),
    [tiers]
  );
  const tableColumns = useMemo(() => partnerColumns(tierCodes), [tierCodes]);

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.partnerType && { partnerType: params.partnerType as PartnerType }),
    ...(params.status && { status: params.status as PartnerStatus }),
    ...(params.tierCode && { tierCode: params.tierCode })
  };

  const { data } = useSuspenseQuery(partnersQueryOptions(filters));
  const pageCount = Math.ceil((data.totalCount ?? 0) / params.perPage);

  const { table } = useDataTable({
    data: data.data,
    columns: tableColumns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  return (
    <DataTable
      table={table}
      totalRowCount={data.totalCount}
      // "nếu từ chối thì ẩn/làm mờ" (#095). Dimmed rather than hidden: an admin
      // still needs to find a rejected application — to see why it was turned
      // down, or when that person applies again — but its revenue and profit
      // figures must not read like those of a partner who is actually selling.
      rowClassName={(row) =>
        row.original.status === 'rejected' || row.original.status === 'disabled'
          ? 'opacity-50'
          : undefined
      }
    >
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function PartnersTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
