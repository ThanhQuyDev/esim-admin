'use client';

import { formatDateVn } from '@/lib/format';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Footer } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

/**
 * English on the top line, Vietnamese below — the same layout for every
 * bilingual column (#045). The empty Vietnamese line says what is missing.
 */
function Bilingual({
  en,
  vi,
  missingVi,
  enClassName
}: {
  en?: string | null;
  vi?: string | null;
  missingVi: string;
  enClassName?: string;
}) {
  return (
    <div className='text-sm'>
      <div className={enClassName}>{en || '—'}</div>
      <div className='text-muted-foreground text-xs'>{vi || missingVi}</div>
    </div>
  );
}

function LinkLine({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target='_blank'
      rel='noreferrer'
      className={`block break-all hover:underline ${className ?? ''}`}
    >
      {href}
    </a>
  );
}

// The "Ngôn ngữ" column is gone: every row holds both languages, so it said
// nothing (#045).
export const columns: ColumnDef<Footer>[] = [
  {
    id: 'name',
    accessorKey: 'title',
    header: ({ column }: { column: Column<Footer, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tiêu đề' />
    ),
    cell: ({ row }) => (
      <Bilingual
        en={row.original.title}
        vi={row.original.titleVi}
        missingVi='Chưa có tiếng Việt'
        enClassName='font-medium'
      />
    ),
    meta: { label: 'Tiêu đề', placeholder: 'Tìm tiêu đề...', variant: 'text' as const },
    enableColumnFilter: true
  },
  {
    id: 'url',
    accessorKey: 'url',
    header: 'URL',
    // English URL on top; while it is empty the English site uses the
    // Vietnamese one (#043), so say so instead of showing a blank.
    cell: ({ row }) => (
      <div className='max-w-[320px] text-sm'>
        {row.original.urlEn ? (
          <LinkLine href={row.original.urlEn} className='text-primary' />
        ) : (
          <div className='text-muted-foreground'>Dùng URL tiếng Việt</div>
        )}
        {row.original.url ? (
          <LinkLine href={row.original.url} className='text-muted-foreground text-xs' />
        ) : (
          <div className='text-muted-foreground text-xs'>—</div>
        )}
      </div>
    )
  },
  {
    // `category` is the URL param the toolbar search writes to (#045).
    id: 'category',
    accessorKey: 'categories',
    header: 'Tiêu đề cột',
    cell: ({ row }) => (
      <Bilingual
        en={row.original.categories}
        vi={row.original.categoriesVi}
        missingVi='Chưa có tiếng Việt'
      />
    ),
    meta: { label: 'Tiêu đề cột', placeholder: 'Tìm tiêu đề cột...', variant: 'text' as const },
    enableColumnFilter: true
  },
  {
    id: 'sortOrder',
    accessorKey: 'sortOrder',
    header: ({ column }: { column: Column<Footer, unknown> }) => (
      <DataTableColumnHeader column={column} title='Thứ tự' />
    ),
    cell: ({ row }) => <div className='font-mono'>{row.original.sortOrder ?? 0}</div>
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Footer, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày tạo' />
    ),
    cell: ({ row }) => formatDateVn(row.original.createdAt)
  },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
];
