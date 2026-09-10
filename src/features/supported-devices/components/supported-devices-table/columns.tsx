'use client';

import { formatDateVn } from '@/lib/format';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CellAction } from './cell-action';
import { Icons } from '@/components/icons';
import type { SupportedDevice } from '../../api/types';

const DEVICE_TYPE_OPTIONS = [
  { label: 'Smart Phones', value: 'Smart Phones' },
  { label: 'Smart Watches', value: 'Smart Watches' },
  { label: 'Tablets', value: 'Tablets' },
  { label: 'Laptops', value: 'Laptops' }
];

export const columns: ColumnDef<SupportedDevice>[] = [
  {
    id: 'name',
    accessorKey: 'device',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Tên thiết bị' />,
    cell: ({ row }) => <div className='font-medium'>{row.getValue('name')}</div>,
    enableSorting: true,
    enableHiding: false,
    meta: {
      label: 'Thiết bị',
      placeholder: 'Tìm kiếm thiết bị...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'manufacturer',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Nhà sản xuất' />,
    cell: ({ row }) => <div>{row.getValue('manufacturer')}</div>,
    enableSorting: true
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Loại thiết bị' />,
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <div className='inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'>
          {type}
        </div>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: 'Loại thiết bị',
      variant: 'multiSelect' as const,
      options: DEVICE_TYPE_OPTIONS
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Ngày tạo' />,
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt') as string);
      return <div>{formatDateVn(date)}</div>;
    },
    enableSorting: true
  },
  {
    id: 'displayOrder',
    header: 'Thứ tự hiển thị',
    // 0 means the row keeps its alphabetical place, so say that rather than
    // showing a bare 0 an admin has to interpret (#090).
    cell: ({ row }) => {
      const brand = row.original.manufacturerOrder ?? 0;
      const model = row.original.sortOrder ?? 0;
      if (!brand && !model) {
        return <span className='text-muted-foreground text-xs'>Theo A–Z</span>;
      }
      return (
        <div className='text-xs tabular-nums'>
          <div>Hãng: {brand || 'A–Z'}</div>
          <div className='text-muted-foreground'>Thiết bị: {model || 'A–Z'}</div>
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
    enableHiding: false
  }
];
