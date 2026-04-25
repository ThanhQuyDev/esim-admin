'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { HelpCenterArticle } from '../../api/types';
import { CATEGORY_OPTIONS, PARENT_OPTIONS } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

const categoryLabel = (val: string) => CATEGORY_OPTIONS.find((o) => o.value === val)?.label ?? val;
const parentLabel = (val: string) => PARENT_OPTIONS.find((o) => o.value === val)?.label ?? val;

export const columns: ColumnDef<HelpCenterArticle>[] = [
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }: { column: Column<HelpCenterArticle, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tiêu đề' />
    ),
    cell: ({ row }) => (
      <span className='line-clamp-2 max-w-sm font-medium'>{row.original.title}</span>
    ),
    meta: {
      label: 'Tiêu đề',
      placeholder: 'Tìm kiếm tiêu đề...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'category',
    accessorKey: 'category',
    header: 'Danh mục',
    cell: ({ row }) => <Badge variant='outline'>{categoryLabel(row.original.category)}</Badge>,
    enableSorting: false
  },
  {
    id: 'parent',
    accessorKey: 'parent',
    header: 'Thư mục',
    cell: ({ row }) => <Badge variant='secondary'>{parentLabel(row.original.parent)}</Badge>,
    enableSorting: false
  },
  {
    id: 'order',
    accessorKey: 'order',
    header: ({ column }: { column: Column<HelpCenterArticle, unknown> }) => (
      <DataTableColumnHeader column={column} title='Thứ tự' />
    )
  },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
];
