'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { ManufacturerNote } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

/**
 * Every column carries an explicit `id`: `useDataTable` keys its filter and sort
 * params by `column.id`, so a column without one registers under `''` and its
 * filter silently does nothing (#052).
 */
export const columns: ColumnDef<ManufacturerNote>[] = [
  {
    id: 'manufacturer',
    accessorKey: 'manufacturer',
    header: ({ column }: { column: Column<ManufacturerNote, unknown> }) => (
      <DataTableColumnHeader column={column} title='Hãng' />
    ),
    cell: ({ row }) => <div className='font-medium'>{row.original.manufacturer}</div>,
    meta: { label: 'Hãng', variant: 'text' as const }
  },
  {
    id: 'language',
    accessorKey: 'language',
    header: 'Ngôn ngữ',
    cell: ({ row }) => <div>{row.original.language === 'vi' ? 'Vietnamese' : 'English'}</div>
  },
  {
    id: 'note',
    accessorKey: 'note',
    header: 'Nội dung',
    cell: ({ row }) => (
      <div className='text-muted-foreground max-w-[520px] truncate'>{row.original.note}</div>
    ),
    enableSorting: false
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
