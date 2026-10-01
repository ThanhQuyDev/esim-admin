'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { WalletListItem } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { WalletCellAction } from './cell-action';
import { formatDateTimeVn, formatDateVn, formatVnd } from '@/lib/format';
// Same helpers the customer list uses, so Mã KH and Hạng KH read identically on
// both screens (#057).
import { customerCode } from '@/features/users/components/users-table/columns';
import {
  TIER_LABELS,
  TIER_OPTIONS,
  TIER_STYLES
} from '@/features/users/components/users-table/options';

export const columns: ColumnDef<WalletListItem>[] = [
  {
    // Mã khách hàng, formatted exactly as the customer list formats it, so the
    // two screens can be read side by side (#057).
    id: 'customerCode',
    accessorFn: (row) => row.userId,
    header: ({ column }: { column: Column<WalletListItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Mã KH' />
    ),
    cell: ({ row }) => (
      <span className='font-mono text-xs whitespace-nowrap'>
        {customerCode(row.original.userId)}
      </span>
    ),
    meta: {
      label: 'Mã KH',
      placeholder: 'KH-000123 hoặc 123...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    id: 'customerName',
    accessorFn: (row) => `${row.user?.firstName ?? ''} ${row.user?.lastName ?? ''}`.trim(),
    header: 'Tên khách hàng',
    cell: ({ row }) => {
      const name =
        `${row.original.user?.firstName ?? ''} ${row.original.user?.lastName ?? ''}`.trim();
      // An account created for an đặt đơn hộ order has no name yet (#041).
      return name ? (
        <span className='text-sm font-medium'>{name}</span>
      ) : (
        <span className='text-muted-foreground text-sm'>—</span>
      );
    },
    meta: {
      label: 'Tên khách hàng',
      placeholder: 'Tìm theo tên...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true,
    enableSorting: false
  },
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
    // Hạng khách hàng (#057) — the effective tier the backend resolved, not a
    // second derivation here, so this cannot disagree with the customer list.
    id: 'membershipTier',
    accessorFn: (row) => row.user?.membershipTier ?? '',
    header: 'Hạng KH',
    cell: ({ row }) => {
      const tier = row.original.user?.membershipTier;
      if (!tier) return <span className='text-muted-foreground text-sm'>—</span>;
      return (
        <Badge variant='outline' className={TIER_STYLES[tier]}>
          {TIER_LABELS[tier]}
        </Badge>
      );
    },
    meta: {
      label: 'Hạng KH',
      variant: 'multiSelect' as const,
      options: TIER_OPTIONS
    },
    enableColumnFilter: true,
    enableSorting: false
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
          <span className='text-sm'>{formatDateVn(expiryDate)}</span>
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
      return date ? <span className='text-sm'>{formatDateTimeVn(date)}</span> : '—';
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <WalletCellAction data={row.original} />
  }
];
