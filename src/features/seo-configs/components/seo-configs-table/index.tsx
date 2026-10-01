'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { bulkDeleteSeoConfigsMutation, bulkSetSeoConfigsActiveMutation } from '../../api/mutations';
import { seoConfigsQueryOptions } from '../../api/queries';
import { buildSeoConfigApiFilters } from '../../utils/seo-config-filters';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function SeoConfigsTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    pageType: parseAsArrayOf(parseAsString, ','),
    // Meta copy and status filters (#048), keyed by column id.
    metaTitle: parseAsString,
    metaDescription: parseAsString,
    isActive: parseAsArrayOf(parseAsString, ','),
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const apiFilters = buildSeoConfigApiFilters(params);

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

  const { data } = useSuspenseQuery(seoConfigsQueryOptions(filters));
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
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { mutate: bulkSetActive, isPending: isSettingActive } = useMutation({
    ...bulkSetSeoConfigsActiveMutation,
    onSuccess: ({ updated }, { isActive }) => {
      toast.success(
        `Đã chuyển ${updated} cấu hình sang ${isActive ? 'hoạt động' : 'không hoạt động'}`
      );
      table.resetRowSelection();
    },
    onError: (error) => {
      toast.error(error.message || 'Cập nhật trạng thái thất bại');
    }
  });

  const { mutate: bulkDelete, isPending: isDeleting } = useMutation({
    ...bulkDeleteSeoConfigsMutation,
    onSuccess: ({ deleted }) => {
      toast.success(`Đã xoá ${deleted} cấu hình SEO`);
      table.resetRowSelection();
      setBulkDeleteOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Xoá cấu hình SEO thất bại');
    }
  });

  const busy = isSettingActive || isDeleting;

  return (
    <>
      <AlertModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => bulkDelete(selectedIds)}
        loading={isDeleting}
        // Spell out the count: the point of a bulk delete is selecting a lot of
        // rows, so "are you sure?" alone hides what is at stake.
        title={`Xoá ${selectedIds.length} cấu hình SEO đã chọn?`}
        description='Các trang này sẽ mất cấu hình SEO riêng và quay về dùng cấu hình mặc định. Hãy kiểm tra lại số lượng trước khi xác nhận.'
      />
      <DataTable table={table} totalRowCount={data.totalCount}>
        <DataTableToolbar table={table}>
          {/* Only shown with a selection, so the toolbar stays clean otherwise (#049). */}
          {selectedIds.length > 0 && (
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground text-sm whitespace-nowrap'>
                Đã chọn {selectedIds.length}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={busy}
                onClick={() => bulkSetActive({ ids: selectedIds, isActive: true })}
              >
                <Icons.check className='mr-1 h-4 w-4' /> Hoạt động
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={busy}
                onClick={() => bulkSetActive({ ids: selectedIds, isActive: false })}
              >
                <Icons.close className='mr-1 h-4 w-4' /> Tắt
              </Button>
              <Button
                variant='destructive'
                size='sm'
                disabled={busy}
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Icons.trash className='mr-1 h-4 w-4' /> Xoá
              </Button>
            </div>
          )}
        </DataTableToolbar>
      </DataTable>
    </>
  );
}

export function SeoConfigsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
