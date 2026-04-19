'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CellAction } from './cell-action';
import type { SupportedDevice } from '../../api/types';

export const columns: ColumnDef<SupportedDevice>[] = [
  {
    accessorKey: 'device',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Tên thiết bị' />,
    cell: ({ row }) => <div className='font-medium'>{row.getValue('device')}</div>,
    enableSorting: true,
    enableHiding: false
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
    enableSorting: true
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Ngày tạo' />,
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt') as string);
      return <div>{date.toLocaleDateString('vi-VN')}</div>;
    },
    enableSorting: true
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
    enableHiding: false
  }
];
