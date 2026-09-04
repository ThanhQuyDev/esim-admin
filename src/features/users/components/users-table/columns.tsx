'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { User } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { formatVnd } from '@/lib/format';

const TIER_LABELS: Record<User['membershipTier'], string> = {
  traveler: 'Du khách',
  silver: 'Du khách bạc',
  gold: 'Du khách vàng',
  platinum: 'Du khách bạch kim'
};

const TIER_STYLES: Record<User['membershipTier'], string> = {
  traveler: 'border-sky-200 bg-sky-50 text-sky-700',
  silver: 'border-slate-300 bg-slate-100 text-slate-700',
  gold: 'border-amber-300 bg-amber-50 text-amber-700',
  platinum: 'border-violet-300 bg-violet-50 text-violet-700'
};

export const columns: ColumnDef<User>[] = [
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
    id: 'status',
    accessorFn: (row) => String(row.status?.id),
    header: 'TRẠNG THÁI',
    cell: ({ row }) => {
      const statusName = row.original.status?.name?.toLowerCase();
      const variant =
        statusName === 'active' ? 'default' : statusName === 'inactive' ? 'secondary' : 'outline';
      return <Badge variant={variant}>{row.original.status?.name}</Badge>;
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
