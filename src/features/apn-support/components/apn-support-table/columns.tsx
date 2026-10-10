'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { ApnSupport } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { ApnRowActions } from './row-actions';

function YesNo({ value }: { value: boolean }) {
  return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Có' : 'Không'}</Badge>;
}

/** Auto-added from plans and not filled in yet — not the same as "Không" (#044). */
function Unknown() {
  return (
    <Badge variant='outline' className='text-muted-foreground'>
      Chưa có
    </Badge>
  );
}

/**
 * ChatGPT / Gemini / Claude are one column in the sheet but stored per device. Both
 * yes reads "Có"; one side only says which, so a row edited by hand is never shown
 * as plain "Không".
 */
function PerDevice({ ios, android }: { ios: boolean; android: boolean }) {
  if (ios && android) return <YesNo value />;
  if (!ios && !android) return <YesNo value={false} />;
  return (
    <Badge variant='outline' className='border-amber-300 text-amber-700'>
      {ios ? 'Chỉ iPhone' : 'Chỉ Android'}
    </Badge>
  );
}

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Platforms the "Hỗ trợ" filter can require (#044, test round 4). */
export const SUPPORT_OPTIONS = [
  { value: 'tiktokIos', label: 'TikTok iPhone' },
  { value: 'tiktokAndroid', label: 'TikTok Android' },
  { value: 'chatGpt', label: 'ChatGPT' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'claude', label: 'Claude' }
];

export type ApnColumnOptions = {
  /** APN names for the select box, loaded at runtime. */
  apnOptions?: { value: string; label: string }[];
};

/**
 * Every column carries an explicit `id` — `useDataTable` keys its filter and sort
 * params by `column.id`, so a column without one registers under `''` and its
 * filter silently does nothing (#052).
 *
 * #044 (test round 4): the ChatGPT column read `chatGpt`, a field the API stopped
 * sending when the apps were split per device, so it showed "Không" on every row
 * whatever the sheet said. Gemini and Claude were imported but never shown.
 */
export function buildColumns(options: ApnColumnOptions = {}): ColumnDef<ApnSupport>[] {
  const { apnOptions = [] } = options;
  const appCell = (row: ApnSupport, cell: React.ReactNode) =>
    row.needsReview ? <Unknown /> : cell;

  return [
    {
      id: 'apn',
      accessorKey: 'apnLabel',
      header: ({ column }: { column: Column<ApnSupport, unknown> }) => (
        <DataTableColumnHeader column={column} title='APN' />
      ),
      cell: ({ row }) => <span className='font-mono font-medium'>{row.original.apnLabel}</span>,
      enableSorting: false,
      enableColumnFilter: true,
      meta: { label: 'APN', variant: 'multiSelect' as const, options: apnOptions }
    },
    {
      id: 'tiktokIos',
      accessorKey: 'tiktokIos',
      header: 'TikTok iPhone',
      cell: ({ row }) => appCell(row.original, <YesNo value={row.original.tiktokIos} />)
    },
    {
      id: 'tiktokAndroid',
      accessorKey: 'tiktokAndroid',
      header: 'TikTok Android',
      cell: ({ row }) => appCell(row.original, <YesNo value={row.original.tiktokAndroid} />)
    },
    {
      id: 'chatGpt',
      header: 'ChatGPT',
      cell: ({ row }) =>
        appCell(
          row.original,
          <PerDevice ios={row.original.chatGptIos} android={row.original.chatGptAndroid} />
        )
    },
    {
      id: 'gemini',
      header: 'Gemini',
      cell: ({ row }) =>
        appCell(
          row.original,
          <PerDevice ios={row.original.geminiIos} android={row.original.geminiAndroid} />
        )
    },
    {
      id: 'claude',
      header: 'Claude',
      cell: ({ row }) =>
        appCell(
          row.original,
          <PerDevice ios={row.original.claudeIos} android={row.original.claudeAndroid} />
        )
    },
    {
      // Filter only: which platforms a row must support (#044).
      id: 'supports',
      // TanStack only filters columns that have an accessor.
      accessorFn: () => '',
      header: 'Hỗ trợ',
      enableHiding: false,
      enableColumnFilter: true,
      meta: { label: 'Nền tảng hỗ trợ', variant: 'multiSelect' as const, options: SUPPORT_OPTIONS }
    },
    {
      id: 'review',
      accessorFn: (row) => (row.needsReview ? 'true' : 'false'),
      header: 'Trạng thái',
      cell: ({ row }) =>
        row.original.needsReview ? (
          <Badge variant='outline' className='border-amber-300 text-amber-700'>
            Chưa có thông tin
          </Badge>
        ) : (
          <span className='text-muted-foreground text-xs'>Đã điền</span>
        ),
      enableColumnFilter: true,
      meta: {
        label: 'Trạng thái',
        variant: 'multiSelect' as const,
        options: [
          { value: 'true', label: 'Chưa có thông tin' },
          { value: 'false', label: 'Đã điền' }
        ]
      }
    },
    {
      id: 'note',
      accessorKey: 'note',
      header: 'Ghi chú',
      cell: ({ row }) => (
        <span className='text-muted-foreground whitespace-normal'>{row.original.note || '—'}</span>
      ),
      enableSorting: false
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ row }) => (
        <span className='text-xs tabular-nums whitespace-nowrap'>
          {formatDateTime(row.original.createdAt)}
        </span>
      )
    },
    {
      id: 'updatedAt',
      accessorKey: 'updatedAt',
      header: 'Cập nhật',
      cell: ({ row }) => (
        <span className='text-muted-foreground text-xs tabular-nums whitespace-nowrap'>
          {formatDateTime(row.original.updatedAt)}
        </span>
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => <ApnRowActions row={row.original} />
    }
  ];
}

export const columns = buildColumns();
