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
import { bulkDeleteFaqsMutation, bulkSetFaqsActiveMutation } from '../../api/mutations';
import { faqsQueryOptions } from '../../api/queries';
import { buildFaqApiFilters } from '../../utils/faq-filters';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function FaqsTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    // Status filter (#050), keyed by column id.
    isActive: parseAsArrayOf(parseAsString, ','),
    sort: getSortingStateParser(columnIds).withDefault([])
  });
  const apiFilters = buildFaqApiFilters(params);
  const apiSort = params.sort.map((s) => ({ orderBy: s.id, order: s.desc ? 'DESC' : 'ASC' }));
  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(Object.keys(apiFilters).length > 0 && { filters: JSON.stringify(apiFilters) }),
    ...(apiSort.length > 0 && { sort: JSON.stringify(apiSort) })
  };
  const { data } = useSuspenseQuery(faqsQueryOptions(filters));
  const pageCount = Math.ceil((data.totalCount ?? 0) / params.perPage);
  const { table } = useDataTable({
    data: data.data,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: { columnPinning: { right: ['actions'] } }
  });

  const selectedIds = table.getSelectedRowModel().rows.map((row) => String(row.original.id));
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { mutate: bulkSetActive, isPending: isSettingActive } = useMutation({
    ...bulkSetFaqsActiveMutation,
    onSuccess: ({ updated }, { isActive }) => {
      toast.success(
        `Đã chuyển ${updated} câu hỏi sang ${isActive ? 'hoạt động' : 'không hoạt động'}`
      );
      table.resetRowSelection();
    },
    onError: (error) => {
      toast.error(error.message || 'Cập nhật trạng thái thất bại');
    }
  });

  const { mutate: bulkDelete, isPending: isDeleting } = useMutation({
    ...bulkDeleteFaqsMutation,
    onSuccess: ({ deleted }) => {
      toast.success(`Đã xoá ${deleted} câu hỏi`);
      table.resetRowSelection();
      setBulkDeleteOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Xoá câu hỏi thất bại');
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
        title={`Xoá ${selectedIds.length} câu hỏi đã chọn?`}
        // A FAQ has no soft delete — `remove` is a hard delete — so say so
        // instead of implying it can be undone.
        description='Các câu hỏi này sẽ bị xoá vĩnh viễn, không thể phục hồi. Nếu chỉ muốn ẩn khỏi trang web, hãy dùng "Tắt".'
      />
      <DataTable table={table} totalRowCount={data.totalCount}>
        <DataTableToolbar table={table}>
          {/* Only shown with a selection, so the toolbar stays clean otherwise (#051). */}
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

export function FaqsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
