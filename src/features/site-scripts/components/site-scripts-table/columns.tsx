'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { SiteScript } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { PLACEMENT_OPTIONS } from '../../schemas/site-script';

const PLACEMENT_LABELS = new Map<string, string>([
  ['head', '<head>'],
  ['bodyEnd', 'cuối <body>']
]);

/**
 * Every column carries an explicit `id`: `useDataTable` keys its filter and sort
 * params by `column.id`, so a column without one registers under `''` and its
 * filter silently does nothing (#052).
 */
export const columns: ColumnDef<SiteScript>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<SiteScript, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tên' />
    ),
    cell: ({ row }) => <div className='font-medium'>{row.original.name}</div>,
    meta: { label: 'Tên', variant: 'text' as const }
  },
  {
    id: 'content',
    accessorKey: 'content',
    header: 'Đoạn mã',
    cell: ({ row }) => (
      <code className='text-muted-foreground block max-w-[420px] truncate text-xs'>
        {row.original.content.replace(/\s+/g, ' ').trim()}
      </code>
    ),
    enableSorting: false
  },
  {
    id: 'placement',
    accessorKey: 'placement',
    header: 'Vị trí',
    cell: ({ row }) => (
      <Badge variant='outline'>
        {PLACEMENT_LABELS.get(row.original.placement) ?? row.original.placement}
      </Badge>
    ),
    meta: {
      label: 'Vị trí',
      variant: 'select' as const,
      options: PLACEMENT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
    }
  },
  {
    id: 'sortOrder',
    accessorKey: 'sortOrder',
    header: ({ column }: { column: Column<SiteScript, unknown> }) => (
      <DataTableColumnHeader column={column} title='Thứ tự' />
    ),
    cell: ({ row }) => <div className='tabular-nums'>{row.original.sortOrder}</div>
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Hoạt động',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
        {row.original.isActive ? 'Đang chạy' : 'Đã tắt'}
      </Badge>
    )
  },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
];
