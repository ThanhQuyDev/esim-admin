'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import type { HeroBanner } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<HeroBanner>[] = [
  {
    id: 'name',
    accessorKey: 'title',
    header: ({ column }: { column: Column<HeroBanner, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tiêu đề' />
    ),
    cell: ({ row }) => <div className='font-medium'>{row.original.title}</div>,
    meta: { label: 'Tiêu đề', placeholder: 'Tìm kiếm...', variant: 'text' as const },
    enableColumnFilter: true
  },
  {
    id: 'firstContent',
    accessorKey: 'firstContent',
    header: 'First Content',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        {row.original.firstIcon && (
          <img src={row.original.firstIcon} alt='' className='h-6 w-6 rounded object-cover' />
        )}
        <span className='text-sm'>{row.original.firstContent}</span>
      </div>
    ),
    enableSorting: false
  },
  {
    id: 'secondContent',
    accessorKey: 'secondContent',
    header: 'Second Content',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        {row.original.secondIcon && (
          <img src={row.original.secondIcon} alt='' className='h-6 w-6 rounded object-cover' />
        )}
        <span className='text-sm'>{row.original.secondContent}</span>
      </div>
    ),
    enableSorting: false
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Mô tả',
    cell: ({ row }) => (
      <div className='max-w-[200px] truncate text-sm'>{row.original.description}</div>
    ),
    enableSorting: false
  },
  {
    id: 'language',
    accessorKey: 'language',
    header: 'Ngôn ngữ',
    cell: ({ row }) => (
      <Badge variant='outline'>{row.original.language === 'vi' ? 'Vietnamese' : 'English'}</Badge>
    ),
    enableSorting: false
  },
  {
    id: 'active',
    accessorKey: 'active',
    header: 'Trạng thái',
    cell: ({ row }) => (
      <Badge variant={row.original.active ? 'default' : 'secondary'}>
        {row.original.active ? 'Hoạt động' : 'Không hoạt động'}
      </Badge>
    ),
    enableSorting: false,
    meta: {
      label: 'Trạng thái',
      variant: 'text' as const,
      icon: Icons.circleCheck
    }
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<HeroBanner, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày tạo' />
    ),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('vi-VN')
  },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
];
