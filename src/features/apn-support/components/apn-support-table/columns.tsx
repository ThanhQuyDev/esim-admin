'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { ApnSupport } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';

function YesNo({ value }: { value: boolean }) {
  return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Có' : 'Không'}</Badge>;
}

/**
 * Read-only: the table comes from the uploaded sheet, which is the source of
 * truth. Editing a row here would be undone by the next upload (#065).
 *
 * Every column carries an explicit `id` — `useDataTable` keys its filter and sort
 * params by `column.id`, so a column without one registers under `''` and its
 * filter silently does nothing (#052).
 */
export const columns: ColumnDef<ApnSupport>[] = [
  {
    id: 'apn',
    accessorKey: 'apnLabel',
    header: ({ column }: { column: Column<ApnSupport, unknown> }) => (
      <DataTableColumnHeader column={column} title='APN' />
    ),
    cell: ({ row }) => <span className='font-mono font-medium'>{row.original.apnLabel}</span>,
    meta: { label: 'APN', variant: 'text' as const }
  },
  {
    id: 'tiktokIos',
    accessorKey: 'tiktokIos',
    header: 'TikTok iPhone',
    cell: ({ row }) => <YesNo value={row.original.tiktokIos} />
  },
  {
    id: 'tiktokAndroid',
    accessorKey: 'tiktokAndroid',
    header: 'TikTok Android',
    cell: ({ row }) => <YesNo value={row.original.tiktokAndroid} />
  },
  {
    id: 'chatGpt',
    accessorKey: 'chatGpt',
    header: 'ChatGPT',
    cell: ({ row }) => <YesNo value={row.original.chatGpt} />
  },
  {
    id: 'note',
    accessorKey: 'note',
    header: 'Ghi chú',
    cell: ({ row }) => <span className='text-muted-foreground'>{row.original.note || '—'}</span>,
    enableSorting: false
  }
];
