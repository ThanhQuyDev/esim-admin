'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { MenuSlide } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { MENU_KEY_OPTIONS } from '../../schemas/menu-slide';

const MENU_LABELS = new Map(MENU_KEY_OPTIONS.map((o) => [o.value as string, o.label]));

/**
 * Every column carries an explicit `id`: `useDataTable` keys its filter and sort
 * params by `column.id`, so a column without one registers under `''` and its
 * filter silently does nothing (#052).
 */
export const columns: ColumnDef<MenuSlide>[] = [
  {
    id: 'image',
    accessorKey: 'image',
    header: 'Hình',
    cell: ({ row }) =>
      row.original.image ? (
        <img
          src={row.original.image}
          alt={row.original.imageAlt ?? row.original.title}
          className='h-10 w-20 rounded-md object-cover'
        />
      ) : (
        <div className='bg-muted text-muted-foreground flex h-10 w-20 items-center justify-center rounded-md text-xs'>
          No image
        </div>
      ),
    enableSorting: false
  },
  {
    id: 'menuKey',
    accessorKey: 'menuKey',
    header: 'Menu',
    cell: ({ row }) => (
      <Badge variant='outline'>
        {MENU_LABELS.get(row.original.menuKey) ?? row.original.menuKey}
      </Badge>
    ),
    meta: {
      label: 'Menu',
      variant: 'select' as const,
      options: MENU_KEY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
    },
    enableColumnFilter: true
  },
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }: { column: Column<MenuSlide, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tiêu đề' />
    ),
    cell: ({ row }) => <div className='font-medium'>{row.original.title}</div>,
    meta: { label: 'Tiêu đề', variant: 'text' as const }
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Mô tả',
    cell: ({ row }) => (
      <div className='text-muted-foreground max-w-[320px] truncate'>{row.original.description}</div>
    ),
    enableSorting: false
  },
  {
    id: 'href',
    accessorKey: 'href',
    header: 'Đường dẫn',
    cell: ({ row }) => (
      <span className='text-muted-foreground font-mono text-xs'>{row.original.href}</span>
    ),
    enableSorting: false
  },
  {
    id: 'language',
    accessorKey: 'language',
    header: 'Ngôn ngữ',
    cell: ({ row }) => <div>{row.original.language === 'vi' ? 'Vietnamese' : 'English'}</div>
  },
  {
    id: 'sortOrder',
    accessorKey: 'sortOrder',
    header: ({ column }: { column: Column<MenuSlide, unknown> }) => (
      <DataTableColumnHeader column={column} title='Thứ tự' />
    ),
    cell: ({ row }) => <div className='tabular-nums'>{row.original.sortOrder}</div>
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Hiển thị',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
        {row.original.isActive ? 'Đang hiện' : 'Đang ẩn'}
      </Badge>
    )
  },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
];
