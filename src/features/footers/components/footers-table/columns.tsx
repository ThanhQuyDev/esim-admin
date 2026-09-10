'use client';

import { formatDateVn } from '@/lib/format';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Footer } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Footer>[] = [
  {
    id: 'name',
    accessorKey: 'title',
    header: ({ column }: { column: Column<Footer, unknown> }) => (
      <DataTableColumnHeader column={column} title='Title' />
    ),
    cell: ({ row }) => <div className='font-medium'>{row.original.title}</div>,
    meta: { label: 'Title', placeholder: 'Tìm kiếm...', variant: 'text' as const },
    enableColumnFilter: true
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
  {
    id: 'sortOrder',
    accessorKey: 'sortOrder',
    header: ({ column }: { column: Column<Footer, unknown> }) => (
      <DataTableColumnHeader column={column} title='Thứ tự' />
    ),
    cell: ({ row }) => <div className='font-mono'>{row.original.sortOrder ?? 0}</div>
  },
  {
    id: 'language',
    accessorKey: 'language',
    header: 'Ngôn ngữ',
    cell: ({ row }) => {
      const lang = row.original.language;
      return <div>{lang === 'vi' ? 'Tiếng Việt' : lang === 'en' ? 'English' : lang}</div>;
    }
  },
  {
    id: 'categories',
    accessorKey: 'categories',
    header: 'Tiêu đề cột',
    // Both headings, so an admin can see at a glance which rows still
    // need the Vietnamese one filled in (#088).
    cell: ({ row }) => (
      <div className='text-sm'>
        <div>{row.original.categories || '—'}</div>
        <div className='text-muted-foreground text-xs'>
          {row.original.categoriesVi || 'Chưa có tiếng Việt'}
        </div>
      </div>
    )
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Footer, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày tạo' />
    ),
    cell: ({ row }) => formatDateVn(row.original.createdAt)
  },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
];
