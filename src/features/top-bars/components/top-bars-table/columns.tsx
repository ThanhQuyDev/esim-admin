'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { TopBar } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { getFilePreviewUrl } from '@/features/landing-page/utils/file-preview';

export const columns: ColumnDef<TopBar>[] = [
  {
    id: 'icon',
    accessorKey: 'icon',
    header: 'Icon',
    cell: ({ row }) => {
      const iconUrl = getFilePreviewUrl(row.original.icon);
      return iconUrl ? (
        <img src={iconUrl} alt='Top bar icon' className='h-10 w-10 rounded-md object-cover' />
      ) : (
        <div className='bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md text-xs'>
          No icon
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }: { column: Column<TopBar, unknown> }) => (
      <DataTableColumnHeader column={column} title='Title' />
    ),
    cell: ({ row }) => <div className='font-medium'>{row.original.title}</div>,
    meta: { label: 'Title', variant: 'text' as const }
  },
  { id: 'buttonContent', accessorKey: 'buttonContent', header: 'Button content' },
  {
    id: 'language',
    accessorKey: 'language',
    header: 'Ngôn ngữ',
    cell: ({ row }) => <div>{row.original.language === 'vi' ? 'Vietnamese' : 'English'}</div>
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
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<TopBar, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày tạo' />
    ),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('vi-VN')
  },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
];
