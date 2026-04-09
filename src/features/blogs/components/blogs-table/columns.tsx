'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Blog } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Blog>[] = [
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }: { column: Column<Blog, unknown> }) => (
      <DataTableColumnHeader column={column} title='Title' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.title}</span>
        <span className='text-muted-foreground text-xs'>{row.original.slug}</span>
      </div>
    ),
    meta: {
      label: 'Title',
      placeholder: 'Search blogs...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'author',
    accessorKey: 'author',
    header: ({ column }: { column: Column<Blog, unknown> }) => (
      <DataTableColumnHeader column={column} title='Author' />
    )
  },
  {
    id: 'language',
    accessorKey: 'language',
    header: 'Lang',
    cell: ({ row }) => <Badge variant='outline'>{row.original.language.toUpperCase()}</Badge>,
    enableSorting: false
  },
  {
    id: 'isPublished',
    accessorKey: 'isPublished',
    header: 'Published',
    cell: ({ row }) => (
      <Badge variant={row.original.isPublished ? 'default' : 'secondary'}>
        {row.original.isPublished ? 'Published' : 'Draft'}
      </Badge>
    ),
    enableSorting: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
