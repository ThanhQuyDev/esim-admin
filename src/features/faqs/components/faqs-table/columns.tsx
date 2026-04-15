'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Faq } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Faq>[] = [
  {
    id: 'question',
    accessorKey: 'question',
    header: ({ column }: { column: Column<Faq, unknown> }) => (
      <DataTableColumnHeader column={column} title='Câu hỏi' />
    ),
    cell: ({ row }) => (
      <span className='line-clamp-2 max-w-sm font-medium'>{row.original.question}</span>
    ),
    meta: {
      label: 'Câu hỏi',
      placeholder: 'Tìm kiếm câu hỏi...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'answer',
    accessorKey: 'answer',
    header: 'Câu trả lời',
    cell: ({ row }) => <span className='line-clamp-2 max-w-sm text-sm'>{row.original.answer}</span>
  },
  {
    id: 'language',
    accessorKey: 'language',
    header: 'Ngôn ngữ',
    cell: ({ row }) => <Badge variant='outline'>{row.original.language.toUpperCase()}</Badge>,
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
    enableSorting: false
  },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
];
