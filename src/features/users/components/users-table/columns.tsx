'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { User } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { formatDateVn, formatVnd } from '@/lib/format';

import { TIER_LABELS, TIER_OPTIONS, TIER_STYLES, USER_STATUS_OPTIONS } from './options';

/** Customer code shown to staff: the user id, zero-padded (#056). */
export function customerCode(id: number): string {
  return `KH-${String(id).padStart(6, '0')}`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days until the eXU expires; negative once it has passed (#038). */
function exuDaysLeft(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const at = new Date(expiresAt).getTime();
  if (Number.isNaN(at)) return null;
  return Math.ceil((at - Date.now()) / MS_PER_DAY);
}

function isExuExpired(expiresAt: string | null | undefined): boolean {
  const days = exuDaysLeft(expiresAt);
  return days !== null && days <= 0;
}

export const columns: ColumnDef<User>[] = [
  {
    id: 'customerCode',
    accessorKey: 'id',
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Mã KH' />
    ),
    cell: ({ row }) => (
      <span className='font-mono text-xs whitespace-nowrap'>{customerCode(row.original.id)}</span>
    ),
    meta: {
      label: 'Mã KH',
      placeholder: 'KH-000123 hoặc 123...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'name',
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tên' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>
          {row.original.firstName} {row.original.lastName}
        </span>
        <span className='text-muted-foreground text-xs'>{row.original.email}</span>
      </div>
    ),
    meta: {
      label: 'Tên',
      placeholder: 'Tìm theo tên, email, số điện thoại...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'phoneNumber',
    accessorKey: 'phoneNumber',
    enableSorting: false,
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Số điện thoại' />
    ),
    cell: ({ row }) => {
      const phone = row.original.phoneNumber;
      if (!phone) return <span className='text-muted-foreground'>—</span>;
      return (
        <a href={`tel:${phone}`} className='hover:underline'>
          {phone}
        </a>
      );
    },
    meta: {
      label: 'Số điện thoại',
      icon: Icons.phone
    },
    enableColumnFilter: false
  },
  {
    id: 'referralCode',
    accessorKey: 'referralCode',
    enableSorting: false,
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Mã giới thiệu' />
    ),
    cell: ({ row }) => {
      const code = row.original.referralCode;
      // Empty until the customer opens their referral page, which is when the
      // code is generated — not an error.
      if (!code) return <span className='text-muted-foreground'>—</span>;
      return (
        <Badge variant='outline' className='font-mono'>
          {code}
        </Badge>
      );
    },
    enableColumnFilter: false
  },
  {
    id: 'membershipTier',
    accessorKey: 'membershipTier',
    enableSorting: false,
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Hạng thành viên' />
    ),
    cell: ({ row }) => {
      const tier = row.original.membershipTier;
      return (
        <div className='flex flex-col items-start gap-1'>
          <Badge variant='outline' className={TIER_STYLES[tier]}>
            {TIER_LABELS[tier]}
          </Badge>
          {row.original.tierSource === 'override' && (
            <span className='text-muted-foreground text-xs'>Đã điều chỉnh</span>
          )}
        </div>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Hạng thành viên',
      variant: 'multiSelect' as const,
      options: TIER_OPTIONS
    }
  },
  {
    id: 'lifetimeSpendVnd',
    accessorKey: 'lifetimeSpendVnd',
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tổng chi tiêu' />
    ),
    cell: ({ row }) => (
      <span className='font-medium tabular-nums'>{formatVnd(row.original.lifetimeSpendVnd)}</span>
    )
  },
  {
    id: 'paidOrderCount',
    accessorKey: 'paidOrderCount',
    enableSorting: false,
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tổng đơn' />
    ),
    cell: ({ row }) => {
      const count = row.original.paidOrderCount ?? 0;
      return (
        <span
          className={count > 0 ? 'font-medium tabular-nums' : 'text-muted-foreground tabular-nums'}
        >
          {count}
        </span>
      );
    },
    enableColumnFilter: false
  },
  {
    id: 'exuBalanceVnd',
    accessorKey: 'exuBalanceVnd',
    enableSorting: false,
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Số dư eXU' />
    ),
    cell: ({ row }) => {
      // The headline figure is what the customer can actually spend — the same
      // one their own wallet page shows (#038).
      const available = row.original.exuBalanceVnd ?? 0;
      const gross = row.original.exuGrossBalanceVnd ?? 0;
      const held = row.original.exuHeldVnd ?? 0;
      const locked = row.original.exuWalletStatus
        ? row.original.exuWalletStatus !== 'active'
        : false;
      const expired = isExuExpired(row.original.exuExpiresAt);

      return (
        <div className='flex flex-col items-start'>
          <span
            className={
              available > 0 ? 'font-medium tabular-nums' : 'text-muted-foreground tabular-nums'
            }
          >
            {formatVnd(available)}
          </span>
          {/* A spendable 0 on top of a non-zero ledger needs a reason, or it
              reads as if the eXU disappeared. */}
          {available !== gross && (
            <span className='text-muted-foreground text-xs'>
              {locked
                ? `Đã khoá · tổng ${formatVnd(gross)}`
                : expired
                  ? `Đã hết hạn · tổng ${formatVnd(gross)}`
                  : `Đang giữ ${formatVnd(held)} · tổng ${formatVnd(gross)}`}
            </span>
          )}
        </div>
      );
    },
    enableColumnFilter: false
  },
  {
    id: 'exuExpiresAt',
    accessorKey: 'exuExpiresAt',
    enableSorting: false,
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Thời hạn dùng eXU' />
    ),
    cell: ({ row }) => {
      const expiresAt = row.original.exuExpiresAt;
      // Null means no eXU was ever earned, so there is no clock running.
      if (!expiresAt) return <span className='text-muted-foreground'>—</span>;

      const days = exuDaysLeft(expiresAt);
      const expired = days !== null && days <= 0;

      return (
        <div className='flex flex-col items-start'>
          <span className={expired ? 'text-destructive whitespace-nowrap' : 'whitespace-nowrap'}>
            {formatDateVn(expiresAt)}
          </span>
          <span className='text-muted-foreground text-xs'>
            {expired ? 'Đã hết hạn' : `còn ${days} ngày`}
          </span>
        </div>
      );
    },
    enableColumnFilter: false
  },
  {
    id: 'role',
    accessorFn: (row) => String(row.role?.id),
    enableSorting: false,
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Vai trò' />
    ),
    cell: ({ row }) => {
      return (
        <Badge variant='outline' className='capitalize'>
          {row.original.role?.name}
        </Badge>
      );
    },
    enableColumnFilter: false
  },
  {
    // `userStatus`, not `status`: the column id is the URL param name, and
    // `status` is already a single-value param used by orders and tickets — the
    // same reason the eSIM list uses `esimStatus` (#037).
    id: 'userStatus',
    accessorFn: (row) => String(row.status?.id),
    header: 'TRẠNG THÁI',
    cell: ({ row }) => {
      const statusName = row.original.status?.name?.toLowerCase();
      const variant =
        statusName === 'active' ? 'default' : statusName === 'inactive' ? 'secondary' : 'outline';
      return <Badge variant={variant}>{row.original.status?.name}</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Trạng thái',
      variant: 'multiSelect' as const,
      options: USER_STATUS_OPTIONS
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
