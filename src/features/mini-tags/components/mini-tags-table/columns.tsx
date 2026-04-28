'use client';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { MiniTag } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import Image from 'next/image';

export const columns: ColumnDef<MiniTag>[] = [
  {
    id: 'image',
    accessorKey: 'image',
    header: 'Ảnh',
    cell: ({ row }) =>
      row.original.image ? (
        <Image
          src={row.original.image}
          alt={row.original.title}
          width={48}
          height={48}
          className='rounded-md object-cover'
        />
      ) : (
        <span className='text-muted-foreground'>—</span>
      ),
    enableSorting: false
  },
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }: { column: Column<MiniTag, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tiêu đề' />
    ),
    cell: ({ row }) => (
      <span className='max-w-[200px] truncate font-medium'>{row.original.title}</span>
    ),
    meta: {
      label: 'Tiêu đề',
      placeholder: 'Tìm kiếm tiêu đề...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Mô tả',
    cell: ({ row }) => (
      <span className='text-muted-foreground max-w-[250px] truncate text-xs'>
        {row.original.description || '—'}
      </span>
    ),
    enableSorting: false
  },
  {
    id: 'contentButton',
    accessorKey: 'contentButton',
    header: 'Nút bấm',
    cell: ({ row }) => <span className='text-xs'>{row.original.contentButton || '—'}</span>,
    enableSorting: false
  },
  {
    id: 'linkUrl',
    accessorKey: 'linkUrl',
    header: 'Link URL',
    cell: ({ row }) => (
      <span className='max-w-[200px] truncate font-mono text-xs'>
        {row.original.linkUrl || '—'}
      </span>
    ),
    enableSorting: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
