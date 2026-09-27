'use client';

import type { Column, ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import { formatDateVn } from '@/lib/format';
import { formatVnd } from '@/lib/format';

import type { MyOrder } from '../../api/types';

/**
 * Commission lifecycle, with the light/dark pairs the admin console uses for
 * semantic status (see `features/tickets/constants/status.ts`). Colour never
 * carries the meaning alone — the label does.
 */
export const COMMISSION_STATUS: Record<string, { label: string; className: string }> = {
  credited: {
    label: 'Đã duyệt',
    className:
      'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
  },
  pending: {
    // The brief's own words for the 24h hold (#019, #022).
    label: 'Chờ xác nhận',
    className:
      'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300'
  },
  reversed: {
    label: 'Đơn hoàn tiền',
    className:
      'border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
  }
};

export const COMMISSION_STATUS_OPTIONS = Object.entries(COMMISSION_STATUS).map(
  ([value, { label }]) => ({ value, label })
);

export const SOURCE_OPTIONS = [
  { value: 'link', label: 'Liên kết tiếp thị' },
  { value: 'code', label: 'Mã đối tác' }
];

export const columns: ColumnDef<MyOrder>[] = [
  {
    id: 'orderNumber',
    accessorKey: 'orderNumber',
    header: ({ column }: { column: Column<MyOrder, unknown> }) => (
      <DataTableColumnHeader column={column} title='Mã đơn' />
    ),
    cell: ({ row }) => (
      <span className='font-mono text-xs font-semibold'>#{row.original.orderNumber}</span>
    ),
    meta: {
      label: 'Mã đơn',
      placeholder: 'Tìm mã đơn hoặc sản phẩm...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    id: 'product',
    header: 'Sản phẩm',
    cell: ({ row }) => (
      <div className='min-w-0'>
        <p className='truncate text-sm font-medium'>
          {row.original.items.map((i) => i.planName).join(' + ') || '—'}
        </p>
        <p className='text-muted-foreground text-xs'>{formatDateVn(row.original.createdAt)}</p>
      </div>
    ),
    enableSorting: false
  },
  {
    id: 'vndPrice',
    accessorKey: 'vndPrice',
    header: 'Giá trị',
    // Net of refunds (#018); the original is kept beside it so a partner can
    // see why the number moved rather than doubting the report.
    cell: ({ row }) => {
      const refunded = row.original.refundedVnd ?? 0;
      return (
        <div className='flex flex-col'>
          <span className='tabular-nums'>{formatVnd(row.original.vndPrice)}</span>
          {refunded > 0 && (
            <span className='text-muted-foreground text-xs line-through'>
              {formatVnd(row.original.grossVndPrice ?? row.original.vndPrice + refunded)}
            </span>
          )}
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'customerType',
    // A partner bringing first-time buyers is doing something different from
    // one re-selling to the same people (#021).
    accessorFn: (row) => row.customerType ?? 'returning',
    header: 'Khách hàng',
    cell: ({ row }) =>
      row.original.customerType === 'new' ? (
        <Badge variant='secondary'>Khách mới</Badge>
      ) : (
        <Badge variant='outline'>Khách quay lại</Badge>
      ),
    enableColumnFilter: true,
    meta: {
      label: 'Khách hàng',
      variant: 'multiSelect' as const,
      options: [
        { value: 'new', label: 'Khách mới' },
        { value: 'returning', label: 'Khách quay lại' }
      ]
    },
    enableSorting: false
  },
  {
    id: 'source',
    // The toolbar only builds a filter for a column it can read a value from,
    // and attribution is derived rather than stored as its own field.
    accessorFn: (row) => (row.linkCode ? 'link' : 'code'),
    header: 'Nguồn ghi nhận',
    cell: ({ row }) =>
      row.original.linkCode ? (
        <div className='min-w-0'>
          <Badge variant='secondary'>Liên kết</Badge>
          <p className='text-muted-foreground mt-1 font-mono text-xs'>{row.original.linkCode}</p>
        </div>
      ) : (
        <Badge variant='outline'>Mã đối tác</Badge>
      ),
    meta: {
      label: 'Nguồn ghi nhận',
      variant: 'multiSelect' as const,
      options: SOURCE_OPTIONS
    },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    id: 'esimCount',
    accessorKey: 'esimCount',
    header: 'eSIM',
    cell: ({ row }) => <span className='tabular-nums'>{row.original.esimCount}</span>,
    enableSorting: false
  },
  {
    id: 'commissionVnd',
    accessorKey: 'commissionVnd',
    header: 'Hoa hồng',
    cell: ({ row }) => (
      <span className='font-medium tabular-nums'>{formatVnd(row.original.commissionVnd ?? 0)}</span>
    ),
    enableSorting: false
  },
  {
    id: 'commissionStatus',
    accessorKey: 'commissionStatus',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const status = COMMISSION_STATUS[row.original.commissionStatus ?? ''];
      if (!status) return <Badge variant='outline'>{row.original.status}</Badge>;
      return (
        <Badge variant='outline' className={status.className}>
          {status.label}
        </Badge>
      );
    },
    meta: {
      label: 'Trạng thái hoa hồng',
      variant: 'multiSelect' as const,
      options: COMMISSION_STATUS_OPTIONS
    },
    enableColumnFilter: true,
    enableSorting: false
  }
];
