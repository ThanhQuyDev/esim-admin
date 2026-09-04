'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Partner } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { PartnerCellAction } from './cell-action';

const PARTNER_TYPE_LABEL: Record<string, string> = {
  distribution: 'Đối tác phân phối',
  kol: 'KOL'
};

const STATUS_VARIANT: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  pending: 'secondary',
  active: 'default',
  hold: 'outline',
  disabled: 'destructive',
  rejected: 'destructive'
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  hold: 'Tạm giữ',
  disabled: 'Đã khóa',
  rejected: 'Bị từ chối'
};

export const columns: ColumnDef<Partner>[] = [
  {
    id: 'name',
    accessorFn: (row) => row.contactName,
    header: ({ column }: { column: Column<Partner, unknown> }) => (
      <DataTableColumnHeader column={column} title='Đối tác' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='text-sm font-medium'>{row.original.contactName}</span>
        <span className='text-muted-foreground text-xs'>{row.original.contactEmail}</span>
      </div>
    ),
    meta: {
      label: 'Tên/Email',
      placeholder: 'Tìm theo tên, email, công ty...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    id: 'partnerType',
    accessorKey: 'partnerType',
    header: 'Loại',
    cell: ({ row }) => (
      <Badge variant='outline'>
        {PARTNER_TYPE_LABEL[row.original.partnerType] ?? row.original.partnerType}
      </Badge>
    ),
    enableSorting: false
  },
  {
    id: 'companyName',
    accessorKey: 'companyName',
    header: 'Công ty',
    cell: ({ row }) => row.original.companyName || '—'
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
          {STATUS_LABEL[status] ?? status}
        </Badge>
      );
    },
    enableSorting: false
  },
  {
    id: 'tierCode',
    accessorKey: 'tierCode',
    header: 'Hạng',
    cell: ({ row }) => row.original.tierCode || '—'
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Partner, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày đăng ký' />
    ),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('vi-VN')
  },
  {
    id: 'actions',
    cell: ({ row }) => <PartnerCellAction data={row.original} />
  }
];
