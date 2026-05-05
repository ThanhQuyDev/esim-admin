'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Footer } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Footer>[] = [
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }: { column: Column<Footer, unknown> }) => (
      <DataTableColumnHeader column={column} title='Title' />
    ),
    cell: ({ row }) => <div className='font-medium'>{row.original.title}</div>,
    meta: { label: 'Title', variant: 'text' as const }
  },
  {
    id: 'titleVi',
    accessorKey: 'titleVi',
    header: ({ column }: { column: Column<Footer, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tiêu đề tiếng Việt' />
    ),
    cell: ({ row }) => <div>{row.original.titleVi}</div>,
    meta: { label: 'Tiêu đề tiếng Việt', variant: 'text' as const }
  },
  {
    id: 'url',
    accessorKey: 'url',
    header: 'URL',
    cell: ({ row }) => (
      <a
        href={row.original.url}
        target='_blank'
        rel='noreferrer'
        className='text-primary hover:underline'
      >
        {row.original.url}
      </a>
    )
  },
  { id: 'categories', accessorKey: 'categories', header: 'Categories' },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Footer, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày tạo' />
    ),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('vi-VN')
  },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
];
