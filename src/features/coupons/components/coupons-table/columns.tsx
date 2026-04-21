'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Coupon } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Coupon>[] = [
  {
    id: 'code',
    accessorKey: 'code',
    header: ({ column }: { column: Column<Coupon, unknown> }) => (
      <DataTableColumnHeader column={column} title='Mã coupon' />
    ),
    cell: ({ row }) => <span className='font-mono font-semibold'>{row.original.code}</span>,
    meta: {
      label: 'Mã coupon',
      placeholder: 'Tìm kiếm coupon...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'discountPercent',
    accessorKey: 'discountPercent',
    header: ({ column }: { column: Column<Coupon, unknown> }) => (
      <DataTableColumnHeader column={column} title='Giảm giá (%)' />
    ),
    cell: ({ row }) => <Badge variant='outline'>{row.original.discountPercent}%</Badge>
  },
  {
    id: 'maxUsage',
    accessorKey: 'maxUsage',
    header: 'Lượt dùng tối đa',
    cell: ({ row }) => <span>{row.original.maxUsage}</span>,
    enableSorting: false
  },
  {
    id: 'maxUsagePerUser',
    accessorKey: 'maxUsagePerUser',
    header: 'Lượt/người',
    cell: ({ row }) => <span>{row.original.maxUsagePerUser}</span>,
    enableSorting: false
  },
  {
    id: 'minOrderAmount',
    accessorKey: 'minOrderAmount',
    header: ({ column }: { column: Column<Coupon, unknown> }) => (
      <DataTableColumnHeader column={column} title='Đơn tối thiểu ($)' />
    ),
    cell: ({ row }) => <span>${row.original.minOrderAmount}</span>
  },
  {
    id: 'expiresAt',
    accessorKey: 'expiresAt',
    header: ({ column }: { column: Column<Coupon, unknown> }) => (
      <DataTableColumnHeader column={column} title='Hết hạn' />
    ),
    cell: ({ row }) => (
      <span className='text-sm'>
        {new Date(row.original.expiresAt).toLocaleDateString('vi-VN')}
      </span>
    )
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Trạng thái',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
        {row.original.isActive ? 'Hoạt động' : 'Không hoạt động'}
      </Badge>
    ),
    enableSorting: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
