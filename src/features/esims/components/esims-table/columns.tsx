'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Esim } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'outline',
  active: 'default',
  expired: 'destructive',
  deactivated: 'secondary'
};

export const columns: ColumnDef<Esim>[] = [
  {
    id: 'iccid',
    accessorKey: 'iccid',
    header: ({ column }: { column: Column<Esim, unknown> }) => (
      <DataTableColumnHeader column={column} title='ICCID' />
    ),
    cell: ({ row }) => <span className='font-mono text-xs'>{row.original.iccid}</span>,
    meta: {
      label: 'ICCID',
      placeholder: 'Tìm kiếm ICCID...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
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
    id: 'provider',
    accessorKey: 'provider',
    header: 'Nhà cung cấp',
    cell: ({ row }) => row.original.provider || '—'
  },
  {
    id: 'dataUsed',
    accessorKey: 'dataUsed',
    header: 'Dữ liệu đã dùng',
    cell: ({ row }) => (
      <span>
        {row.original.dataUsed} / {row.original.dataTotal}
      </span>
    ),
    enableSorting: false
  },
  {
    id: 'phoneNumber',
    accessorKey: 'phoneNumber',
    header: 'Số điện thoại',
    cell: ({ row }) => row.original.phoneNumber || '—'
  },
  {
    id: 'isRoaming',
    accessorKey: 'isRoaming',
    header: 'Roaming',
    cell: ({ row }) => (
      <Badge variant={row.original.isRoaming ? 'default' : 'secondary'}>
        {row.original.isRoaming ? 'Có' : 'Không'}
      </Badge>
    ),
    enableSorting: false
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Esim, unknown> }) => (
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
