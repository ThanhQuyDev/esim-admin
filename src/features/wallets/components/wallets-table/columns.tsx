'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { WalletListItem } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { WalletCellAction } from './cell-action';
import { formatVnd } from '@/lib/format';

export const columns: ColumnDef<WalletListItem>[] = [
  {
    id: 'name',
    accessorFn: (row) => row.user?.email ?? '',
    header: ({ column }: { column: Column<WalletListItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => <span className='text-sm'>{row.original.user?.email ?? '—'}</span>,
    meta: {
      label: 'Email',
      placeholder: 'Tìm kiếm theo email...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    id: 'balanceVnd',
    accessorKey: 'balanceVnd',
    header: ({ column }: { column: Column<WalletListItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Số dư (VND)' />
    ),
    cell: ({ row }) => <span className='font-medium'>{formatVnd(row.original.balanceVnd)}</span>
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === 'active' ? 'default' : 'destructive'}>
          {status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
        </Badge>
      );
    },
    enableSorting: false
  },
  {
    id: 'expiresAt',
    accessorKey: 'expiresAt',
    header: ({ column }: { column: Column<WalletListItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Hết hạn' />
    ),
    cell: ({ row }) => {
      const expiresAt = row.original.expiresAt;
      if (!expiresAt) return <span className='text-muted-foreground text-sm'>Chưa có</span>;

      const expiryDate = new Date(expiresAt);
      const now = new Date();
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        return <span className='text-destructive text-sm'>Đã hết hạn</span>;
      }

      return (
        <div className='flex flex-col'>
          <span className='text-sm'>{expiryDate.toLocaleDateString('vi-VN')}</span>
          <span className='text-muted-foreground text-xs'>Còn {daysLeft} ngày</span>
        </div>
      );
    }
  },
  {
    id: 'updatedAt',
    accessorKey: 'updatedAt',
    header: ({ column }: { column: Column<WalletListItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Cập nhật' />
    ),
    cell: ({ row }) => {
      const date = row.original.updatedAt;
      return date ? <span className='text-sm'>{new Date(date).toLocaleString('vi-VN')}</span> : '—';
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <WalletCellAction data={row.original} />
  }
];
