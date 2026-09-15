'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import {
  SEO_PAGE_TYPE_LABELS,
  SEO_PAGE_TYPE_OPTIONS,
  seoConfigPageType,
  type SeoConfig
} from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SeoConfig>[] = [
  {
    id: 'name',
    accessorKey: 'url',
    header: ({ column }: { column: Column<SeoConfig, unknown> }) => (
      <DataTableColumnHeader column={column} title='URL' />
    ),
    cell: ({ row }) => <span className='font-mono text-xs'>{row.original.url}</span>,
    meta: {
      label: 'URL',
      placeholder: 'Tìm theo URL trang (vd: /home)...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    // Not a column on the record: derived from which entity the config points
    // at. Filterable so the mixed list can be read one page type at a time (#046).
    id: 'pageType',
    header: 'Loại trang',
    cell: ({ row }) => {
      const type = seoConfigPageType(row.original);
      return (
        <Badge variant={type === 'other' ? 'outline' : 'secondary'}>
          {SEO_PAGE_TYPE_LABELS[type]}
        </Badge>
      );
    },
    meta: {
      label: 'Loại trang',
      // Single-select: the API matches one page type per request.
      variant: 'select' as const,
      options: SEO_PAGE_TYPE_OPTIONS
    },
    enableColumnFilter: true,
    enableSorting: false
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
