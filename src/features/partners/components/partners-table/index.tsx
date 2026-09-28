'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useMemo, useState } from 'react';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { partnersQueryOptions, tiersQueryOptions } from '../../api/queries';
import type { PartnerStatus, PartnerType } from '../../api/types';
import { partnerColumns } from './columns';
import { AddPartnerModal } from '../add-partner-modal';
import { BulkStatusModal } from '../bulk-status-modal';

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

  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

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

  // The rows an admin ticked, for the bulk action (#059).
  const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original.id);

  return (
    <>
      <AddPartnerModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => table.resetRowSelection()}
      />
      <BulkStatusModal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        partnerIds={selectedIds}
        onDone={() => table.resetRowSelection()}
      />

      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <div className='text-muted-foreground text-sm'>
          {selectedIds.length > 0
            ? `Đã chọn ${selectedIds.length} đối tác`
            : 'Tích chọn các dòng để đổi trạng thái hàng loạt'}
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            size='sm'
            variant='outline'
            disabled={selectedIds.length === 0}
            onClick={() => setBulkOpen(true)}
          >
            <Icons.settings className='mr-2 size-4' />
            Thay đổi trạng thái
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              // The file follows the filters on screen (#062): exporting the
              // whole programme when the admin is looking at one tier would be
              // a trap.
              const query = new URLSearchParams();
              if (params.name) query.set('search', params.name);
              if (params.partnerType) query.set('partnerType', params.partnerType);
              if (params.status) query.set('status', params.status);
              if (params.tierCode) query.set('tierCode', params.tierCode);
              window.location.href = `/api/partners/export-excel?${query.toString()}`;
            }}
          >
            <Icons.download className='mr-2 size-4' />
            Xuất Excel
          </Button>
          <Button size='sm' onClick={() => setAddOpen(true)}>
            <Icons.add className='mr-2 size-4' />
            Thêm đối tác
          </Button>
        </div>
      </div>

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
    </>
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
