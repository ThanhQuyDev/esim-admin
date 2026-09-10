'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { esimsQueryOptions } from '../../api/queries';
import { exportEsimsExcel } from '../../api/service';
import { AlertModal } from '@/components/modal/alert-modal';
import { toast } from 'sonner';
import { bulkDeleteEsimsMutation } from '../../api/mutations';
import { ImportEsimExcelDialog } from '../import-esim-excel-dialog';
import { EsimFormDialog } from '../esim-form-dialog';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function EsimsTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    planName: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const apiFilters: Record<string, unknown> = {};
  if (params.name) apiFilters.search = params.name;
  if (params.planName) apiFilters.planName = params.planName;

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

  const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original.id);

  const [exporting, setExporting] = useState(false);
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

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportEsimsExcel(filters);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

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
      <DataTable table={table} totalRowCount={data.totalCount}>
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
          <Button variant='outline' size='sm' onClick={handleExport} disabled={exporting}>
            {exporting ? <Icons.spinner className='animate-spin' /> : <Icons.download />}
            Export Excel
          </Button>
          <EsimFormDialog />
          <ImportEsimExcelDialog />
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
