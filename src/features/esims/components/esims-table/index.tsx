'use client';

import { useState, useSyncExternalStore } from 'react';
import type { Esim } from '../../api/types';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { keepPreviousData, useQuery, useMutation } from '@tanstack/react-query';
import {
  inBrowserSnapshot,
  ListLoadState,
  noSubscribe,
  onServerSnapshot
} from '@/components/ui/table/list-load-state';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { esimsQueryOptions } from '../../api/queries';
import { AlertModal } from '@/components/modal/alert-modal';
import { toast } from 'sonner';
import { bulkDeleteEsimsMutation } from '../../api/mutations';
import { DateRangeFilter } from '@/components/date-range-filter';
import { columns } from './columns';
import { useEsimListFilters } from './use-esim-list-filters';

const NO_ESIMS: Esim[] = [];

/**
 * Drawn in the browser, so changing page keeps the rows on screen with a bar
 * above them, and drops the request of a page already left (vande-0411 #054).
 */
export function EsimsTable() {
  const inBrowser = useSyncExternalStore(noSubscribe, inBrowserSnapshot, onServerSnapshot);
  return inBrowser ? <EsimsTableContent /> : <EsimsTableSkeleton />;
}

function EsimsTableContent() {
  const { params, setParams, filters } = useEsimListFilters();

  const { data, isFetching, isPending, isError, refetch } = useQuery({
    ...esimsQueryOptions(filters),
    placeholderData: keepPreviousData,
    retry: 1
  });
  const pageCount = Math.ceil((data?.totalCount ?? 0) / params.perPage);

  const { table } = useDataTable({
    data: data?.data ?? NO_ESIMS,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original.id);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useMutation({
    ...bulkDeleteEsimsMutation,
    onSuccess: ({ deleted }) => {
      toast.success(`Đã xoá ${deleted} eSIM`);
      table.resetRowSelection();
      setBulkDeleteOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Xoá eSIM thất bại');
    }
  });

  if (isPending) return <EsimsTableSkeleton />;

  return (
    <>
      <AlertModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => bulkDelete(selectedIds)}
        loading={isBulkDeleting}
        // Spell out the count: the whole point of bulk delete is selecting a
        // lot of rows, so "are you sure?" alone hides what is at stake.
        title={`Xoá ${selectedIds.length} eSIM đã chọn?`}
        description='Các eSIM này sẽ biến mất khỏi danh sách quản lý. Hãy kiểm tra lại số lượng trước khi xác nhận.'
      />
      {/* Date ranges (#020). The column filters above cover the select-style
          conditions; a range needs two inputs, which the toolbar cannot express. */}
      {/* The shared time filter (doitac-3010 #031). */}
      <div className='mb-4 flex flex-wrap items-center gap-2'>
        <DateRangeFilter
          label='Ngày tạo'
          from={params.createdFrom ?? undefined}
          to={params.createdTo ?? undefined}
          onChange={(range) =>
            setParams({ createdFrom: range.from ?? null, createdTo: range.to ?? null, page: 1 })
          }
          testId='esims-created'
        />
        <DateRangeFilter
          label='Ngày hết hạn'
          from={params.expiresFrom ?? undefined}
          to={params.expiresTo ?? undefined}
          onChange={(range) =>
            setParams({ expiresFrom: range.from ?? null, expiresTo: range.to ?? null, page: 1 })
          }
          testId='esims-expires'
        />
      </div>

      <ListLoadState loading={isFetching} failed={isError} onRetry={() => refetch()} />
      <DataTable table={table} totalRowCount={data?.totalCount}>
        <DataTableToolbar table={table}>
          {selectedIds.length > 0 ? (
            <Button
              variant='destructive'
              size='sm'
              onClick={() => setBulkDeleteOpen(true)}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? <Icons.spinner className='animate-spin' /> : <Icons.trash />}
              Xoá {selectedIds.length} eSIM
            </Button>
          ) : null}
        </DataTableToolbar>
      </DataTable>
    </>
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
