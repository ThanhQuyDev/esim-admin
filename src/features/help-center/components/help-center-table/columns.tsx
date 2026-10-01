'use client';
import { Badge } from '@/components/ui/badge';
import { formatDateVn } from '@/lib/format';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { HelpCenterArticle } from '../../api/types';
import { getCategoryLabel, getParentLabel } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

/**
 * Column headers are always Vietnamese, like every other table in this CMS.
 *
 * They used to follow `lang` — the CONTENT language filter — so with no language
 * picked (the default) the whole header row rendered in English and "Thứ tự" read
 * "Order" (#053). `lang` now only decides how a row's category / folder label is
 * translated, which genuinely depends on the article's language.
 */
export function buildColumns(lang: string): ColumnDef<HelpCenterArticle>[] {
  const t = {
    title: 'Tiêu đề',
    titleSearch: 'Tìm kiếm tiêu đề...',
    category: 'Danh mục',
    folder: 'Thư mục',
    language: 'Ngôn ngữ',
    order: 'Thứ tự',
    popular: 'Nổi bật',
    published: 'Xuất bản',
    updatedAt: 'Ngày chỉnh sửa'
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
      id: 'isPopular',
      accessorKey: 'isPopular',
      header: t.popular,
      cell: ({ row }) =>
        row.original.isPopular ? (
          <Badge variant='default'>
            <Icons.check className='mr-1 h-3 w-3' />
            {t.popular}
          </Badge>
        ) : (
          <span className='text-muted-foreground/50 text-sm'>—</span>
        ),
      // Filtered from the toolbar, not as a column filter: this table already
      // drives category / folder / language from its own <Select>s, and a column
      // filter would write an array-valued param where the API wants one boolean
      // (#053).
      enableSorting: false
    },
    {
      // Publish status (#053). Drafts were indistinguishable from live articles.
      id: 'isPublished',
      accessorKey: 'isPublished',
      header: t.published,
      cell: ({ row }) => (
        <Badge variant={row.original.isPublished ? 'default' : 'secondary'}>
          {row.original.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
        </Badge>
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
    {
      // Ngày chỉnh sửa (#053) — which article was touched last is how an editor
      // finds the one they were working on.
      id: 'updatedAt',
      accessorKey: 'updatedAt',
      header: ({ column }: { column: Column<HelpCenterArticle, unknown> }) => (
        <DataTableColumnHeader column={column} title={t.updatedAt} />
      ),
      cell: ({ row }) => (
        <span className='text-sm whitespace-nowrap'>
          {formatDateVn(row.original.updatedAt) || '—'}
        </span>
      )
    },
    { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
  ];
}

// Backwards-compatible export (English defaults)
export const columns = buildColumns('en');
