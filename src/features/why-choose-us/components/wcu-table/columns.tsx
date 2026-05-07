'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { WhyChooseUs } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { getFilePreviewUrl } from '@/features/landing-page/utils/file-preview';

export const columns: ColumnDef<WhyChooseUs>[] = [
  {
    id: 'icon',
    accessorKey: 'icon',
    header: 'Biểu tượng',
    cell: ({ row }) => {
      const iconUrl = getFilePreviewUrl(row.original.icon);
      return iconUrl ? (
        <img src={iconUrl} alt='Icon' className='h-10 w-10 rounded-md object-cover' />
      ) : (
        <div className='bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md text-xs'>
          No icon
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }: { column: Column<WhyChooseUs, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tiêu đề' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.title}</span>
      </div>
    ),
    meta: {
      label: 'Tiêu đề',
      placeholder: 'Tìm kiếm...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Mô tả',
    cell: ({ row }) => (
      <div
        className='line-clamp-2 max-w-xs text-sm [&_a]:text-primary [&_a]:underline'
        dangerouslySetInnerHTML={{ __html: row.original.description }}
      />
    )
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
    header: ({ column }: { column: Column<WhyChooseUs, unknown> }) => (
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
