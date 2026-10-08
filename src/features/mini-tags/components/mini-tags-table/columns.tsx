'use client';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { MiniTag } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import Image from 'next/image';

/**
 * English on top, Vietnamese below — the same two-line layout as the Footers
 * list, so every content column shows both languages at a glance (v3 #022).
 */
function Bilingual({
  en,
  vi,
  className,
  mono
}: {
  en?: string | null;
  vi?: string | null;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={`flex flex-col text-xs ${mono ? 'font-mono' : ''} ${className ?? ''}`}>
      <span className='truncate'>
        {en || <span className='text-muted-foreground'>Chưa có tiếng Anh</span>}
      </span>
      <span className='text-muted-foreground truncate'>{vi || '—'}</span>
    </div>
  );
}

export const columns: ColumnDef<MiniTag>[] = [
  {
    id: 'image',
    accessorKey: 'image',
    header: 'Ảnh',
    cell: ({ row }) =>
      row.original.image ? (
        <Image
          src={row.original.image}
          alt={row.original.title}
          width={48}
          height={48}
          className='rounded-md object-cover'
        />
      ) : (
        <span className='text-muted-foreground'>—</span>
      ),
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'title',
    header: ({ column }: { column: Column<MiniTag, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tiêu đề' />
    ),
    cell: ({ row }) => (
      <Bilingual
        en={row.original.titleEn}
        vi={row.original.title}
        className='max-w-[240px] text-sm [&>span:first-child]:font-medium'
      />
    ),
    meta: {
      label: 'Tiêu đề',
      placeholder: 'Tìm kiếm tiêu đề...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Mô tả',
    cell: ({ row }) => (
      <Bilingual
        en={row.original.descriptionEn}
        vi={row.original.description}
        className='max-w-[250px]'
      />
    ),
    enableSorting: false
  },
  {
    id: 'contentButton',
    accessorKey: 'contentButton',
    header: 'Nút bấm',
    cell: ({ row }) => (
      <Bilingual en={row.original.contentButtonEn} vi={row.original.contentButton} />
    ),
    enableSorting: false
  },
  {
    id: 'linkUrl',
    accessorKey: 'linkUrl',
    header: 'Link URL',
    cell: ({ row }) => (
      <Bilingual
        en={row.original.linkUrlEn}
        vi={row.original.linkUrl}
        className='max-w-[200px]'
        mono
      />
    ),
    enableSorting: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
