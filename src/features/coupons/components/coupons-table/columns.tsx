'use client';
import { formatDateVn } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Coupon } from '../../api/types';
import { couponDiscountLabel } from '../../utils/discount';
import { couponUsage } from '../../utils/usage';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Coupon>[] = [
  {
    id: 'name',
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
    header: 'Giảm giá',
    // A flat-amount code has no meaningful percentage, and a capped one
    // gives less than its percentage on a big order (#082).
    cell: ({ row }) => <span>{couponDiscountLabel(row.original)}</span>,
    enableSorting: false
  },
  {
    id: 'usageCount',
    accessorKey: 'usageCount',
    header: 'Đã dùng / Tối đa',
    // The limit on its own said nothing about whether the code is spent
    // (#083), so the two numbers are shown together.
    cell: ({ row }) => {
      const usage = couponUsage(row.original);
      return (
        <div className='flex items-center gap-2'>
          <span className='tabular-nums'>{usage.label}</span>
          {usage.isExhausted && <Badge variant='destructive'>Hết lượt</Badge>}
          {usage.isRunningOut && <Badge variant='outline'>Sắp hết</Badge>}
        </div>
      );
    },
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
      <DataTableColumnHeader column={column} title='Đơn tối thiểu (VNĐ)' />
    ),
    cell: ({ row }) => <span>{Number(row.original.minOrderAmount).toLocaleString('vi-VN')} đ</span>
  },
  {
    id: 'expiresAt',
    accessorKey: 'expiresAt',
    header: ({ column }: { column: Column<Coupon, unknown> }) => (
      <DataTableColumnHeader column={column} title='Hết hạn' />
    ),
    cell: ({ row }) => <span className='text-sm'>{formatDateVn(row.original.expiresAt)}</span>
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const isExpired = row.original.expiresAt && new Date(row.original.expiresAt) < new Date();
      if (isExpired) {
        return <Badge variant='destructive'>Hết hạn</Badge>;
      }
      return (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Badge>
      );
    },
    enableSorting: false
  },
  {
    id: 'partnerId',
    accessorKey: 'partnerId',
    header: 'Đối tác',
    cell: ({ row }) =>
      row.original.partnerId ? (
        <Badge variant='outline'>{row.original.partnerName ?? `#${row.original.partnerId}`}</Badge>
      ) : (
        <span className='text-muted-foreground text-sm'>Mã chung</span>
      ),
    enableSorting: false
  },
  {
    id: 'isPublic',
    accessorKey: 'isPublic',
    header: 'Hiển thị',
    cell: ({ row }) =>
      row.original.isPublic === false ? (
        <Badge variant='outline'>Riêng tư</Badge>
      ) : (
        <Badge variant='secondary'>Công khai</Badge>
      ),
    enableSorting: false
  },
  {
    id: 'isPopular',
    accessorKey: 'isPopular',
    header: 'Nổi bật',
    cell: ({ row }) =>
      row.original.isPopular ? (
        <Badge variant='default'>Nổi bật</Badge>
      ) : (
        <Badge variant='secondary'>—</Badge>
      ),
    enableSorting: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
