'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { HelpCenterArticle } from '../../api/types';
import { getCategoryLabel, getParentLabel } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export function buildColumns(lang: string): ColumnDef<HelpCenterArticle>[] {
  const isVi = lang === 'vi';
  const t = {
    title: isVi ? 'Tiêu đề' : 'Title',
    titleSearch: isVi ? 'Tìm kiếm tiêu đề...' : 'Search title...',
    category: isVi ? 'Danh mục' : 'Category',
    folder: isVi ? 'Thư mục' : 'Folder',
    language: isVi ? 'Ngôn ngữ' : 'Language',
    order: isVi ? 'Thứ tự' : 'Order'
  };

  return [
    {
      id: 'name',
      accessorKey: 'title',
      header: ({ column }: { column: Column<HelpCenterArticle, unknown> }) => (
        <DataTableColumnHeader column={column} title={t.title} />
      ),
      cell: ({ row }) => (
        <span className='line-clamp-2 max-w-sm font-medium'>{row.original.title}</span>
      ),
      meta: {
        label: t.title,
        placeholder: t.titleSearch,
        variant: 'text' as const,
        icon: Icons.text
      },
      enableColumnFilter: true
    },
    {
      id: 'category',
      accessorKey: 'category',
      header: t.category,
      cell: ({ row }) => (
        <Badge variant='outline'>
          {getCategoryLabel(row.original.category, row.original.language ?? lang)}
        </Badge>
      ),
      enableSorting: false
    },
    {
      id: 'parent',
      accessorKey: 'parent',
      header: t.folder,
      cell: ({ row }) => (
        <Badge variant='secondary'>
          {getParentLabel(row.original.parent, row.original.language ?? lang)}
        </Badge>
      ),
      enableSorting: false
    },
    {
      id: 'language',
      accessorKey: 'language',
      header: t.language,
      cell: ({ row }) =>
        row.original.language ? (
          <Badge variant='outline'>{row.original.language.toUpperCase()}</Badge>
        ) : (
          <span className='text-muted-foreground/50 text-sm'>—</span>
        ),
      enableSorting: false
    },
    {
      id: 'order',
      accessorKey: 'order',
      header: ({ column }: { column: Column<HelpCenterArticle, unknown> }) => (
        <DataTableColumnHeader column={column} title={t.order} />
      )
    },
    { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
  ];
}

// Backwards-compatible export (English defaults)
export const columns = buildColumns('en');
