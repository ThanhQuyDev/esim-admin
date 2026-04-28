'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Order } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'default',
  processing: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
  refunded: 'destructive'
};

const paymentMethodLabel: Record<string, string> = {
  credit_card: 'Thẻ tín dụng',
  paypal: 'PayPal',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
  vnpay: 'VNPay'
};

function formatCurrency(amount: number, currency: string) {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
}

export const columns: ColumnDef<Order>[] = [
  {
    id: 'orderNumber',
    accessorKey: 'orderNumber',
    header: ({ column }: { column: Column<Order, unknown> }) => (
      <DataTableColumnHeader column={column} title='Mã đơn hàng' />
    ),
    cell: ({ row }) => (
      <span className='font-mono text-xs font-medium'>{row.original.orderNumber}</span>
    ),
    meta: {
      label: 'Mã đơn hàng',
      placeholder: 'Tìm kiếm đơn hàng...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    id: 'user',
    accessorKey: 'user',
    header: 'Khách hàng',
    cell: ({ row }) => {
      const user = row.original.user;
      if (!user) return '—';
      return (
        <div className='flex flex-col'>
          <span className='text-sm font-medium'>
            {user.firstName} {user.lastName}
          </span>
          <span className='text-muted-foreground text-xs'>{user.email}</span>
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] ?? 'outline'}>{row.original.status}</Badge>
    ),
    enableSorting: false
  },
  {
    id: 'totalAmount',
    accessorKey: 'totalAmount',
    header: ({ column }: { column: Column<Order, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tổng tiền' />
    ),
    cell: ({ row }) => formatCurrency(row.original.totalAmount, row.original.currency)
  },
  {
    id: 'vndPrice',
    accessorKey: 'vndPrice',
    header: 'Giá VND',
    cell: ({ row }) => formatCurrency(row.original.vndPrice, 'VND')
  },
  {
    id: 'paymentMethod',
    accessorKey: 'paymentMethod',
    header: 'Thanh toán',
    cell: ({ row }) => paymentMethodLabel[row.original.paymentMethod] ?? row.original.paymentMethod,
    enableSorting: false
  },
  {
    id: 'couponCode',
    accessorKey: 'couponCode',
    header: 'Coupon',
    cell: ({ row }) =>
      row.original.couponCode ? <Badge variant='secondary'>{row.original.couponCode}</Badge> : '—',
    enableSorting: false
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Order, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày tạo' />
    ),
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return date ? new Date(date).toLocaleDateString('vi-VN') : '—';
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
