'use client';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Faq } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { htmlToText } from '@/lib/html-text';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Faq>[] = [
  {
    // Row selection for the bulk status / delete actions (#051).
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Chọn tất cả'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Chọn hàng'
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40
  },
  {
    id: 'name',
    accessorKey: 'question',
    header: ({ column }: { column: Column<Faq, unknown> }) => (
      <DataTableColumnHeader column={column} title='Câu hỏi' />
    ),
    cell: ({ row }) => (
      <span className='line-clamp-2 max-w-sm font-medium'>{row.original.question}</span>
    ),
    meta: {
      label: 'Câu hỏi',
      placeholder: 'Tìm câu hỏi hoặc trang (vd: /home)...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'answer',
    accessorKey: 'answer',
    header: 'Câu trả lời',
    cell: ({ row }) => {
      // The answer is stored as HTML, so the raw value showed its `<p>` tags in
      // the cell (#050). Text only — the full markup is in the edit form.
      const preview = htmlToText(row.original.answer);
      return (
        <span className='line-clamp-2 max-w-sm text-sm' title={preview}>
          {preview || <span className='text-muted-foreground/50'>—</span>}
        </span>
      );
    },
    enableSorting: false
  },
  {
    id: 'language',
    accessorKey: 'language',
    header: 'Ngôn ngữ',
    cell: ({ row }) => <Badge variant='outline'>{row.original.language.toUpperCase()}</Badge>,
    enableSorting: false
  },
  {
    id: 'url',
    accessorKey: 'url',
    header: 'URL',
    cell: ({ row }) =>
      row.original.url ? (
        <span className='text-muted-foreground text-sm'>{row.original.url}</span>
      ) : (
        <span className='text-muted-foreground/50 text-sm'>—</span>
      ),
    enableSorting: false
  },
  {
    id: 'sortOrder',
    accessorKey: 'sortOrder',
    header: ({ column }: { column: Column<Faq, unknown> }) => (
      <DataTableColumnHeader column={column} title='Thứ tự' />
    )
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Hoạt động',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
        {row.original.isActive ? 'Hoạt động' : 'Không hoạt động'}
      </Badge>
    ),
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Trạng thái',
      // Single-select: the API filter is one boolean, not a set (#050).
      variant: 'select' as const,
      options: [
        { value: 'true', label: 'Hoạt động' },
        { value: 'false', label: 'Không hoạt động' }
      ]
    }
  },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
];
