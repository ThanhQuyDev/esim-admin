'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { SeoConfig } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SeoConfig>[] = [
  {
    id: 'url',
    accessorKey: 'url',
    header: ({ column }: { column: Column<SeoConfig, unknown> }) => (
      <DataTableColumnHeader column={column} title='URL' />
    ),
    cell: ({ row }) => <span className='font-mono text-xs'>{row.original.url}</span>,
    meta: {
      label: 'URL',
      placeholder: 'Tìm kiếm URL...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    id: 'metaTitle',
    accessorKey: 'metaTitle',
    header: ({ column }: { column: Column<SeoConfig, unknown> }) => (
      <DataTableColumnHeader column={column} title='Meta Title' />
    ),
    cell: ({ row }) => <span className='max-w-[200px] truncate'>{row.original.metaTitle}</span>
  },
  {
    id: 'metaDescription',
    accessorKey: 'metaDescription',
    header: 'Meta Description',
    cell: ({ row }) => (
      <span className='text-muted-foreground max-w-[200px] truncate text-xs'>
        {row.original.metaDescription || '—'}
      </span>
    ),
    enableSorting: false
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Trạng thái',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
        {row.original.isActive ? 'Hoạt động' : 'Tắt'}
      </Badge>
    ),
    enableSorting: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
