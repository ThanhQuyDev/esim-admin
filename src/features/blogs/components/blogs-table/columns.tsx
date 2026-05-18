'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Blog } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getWarningBadge(blog: Blog) {
  const now = new Date();
  const updatedAt = new Date(blog.updatedAt);
  const diffDays = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 15) {
    return <Badge variant='destructive'>Lỗi thời</Badge>;
  }
  return <Badge className='bg-green-500 text-white hover:bg-green-600'>Mới</Badge>;
}

export const columns: ColumnDef<Blog>[] = [
  {
    id: 'name',
    accessorKey: 'title',
    header: ({ column }: { column: Column<Blog, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tiêu đề' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.title}</span>
        <span className='text-muted-foreground text-xs'>{row.original.slug}</span>
      </div>
    ),
    meta: {
      label: 'Tiêu đề',
      placeholder: 'Tìm kiếm bài viết...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'author',
    accessorKey: 'author',
    header: ({ column }: { column: Column<Blog, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tác giả' />
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
    id: 'isPublished',
    accessorKey: 'isPublished',
    header: 'Xuất bản',
    cell: ({ row }) => (
      <Badge variant={row.original.isPublished ? 'default' : 'secondary'}>
        {row.original.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
      </Badge>
    ),
    enableSorting: false
  },
  {
    id: 'publishedAt',
    accessorKey: 'publishedAt',
    header: ({ column }: { column: Column<Blog, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày đăng' />
    ),
    cell: ({ row }) => <span className='text-sm'>{formatDate(row.original.publishedAt)}</span>
  },
  {
    id: 'updatedAt',
    accessorKey: 'updatedAt',
    header: ({ column }: { column: Column<Blog, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày sửa' />
    ),
    cell: ({ row }) => <span className='text-sm'>{formatDate(row.original.updatedAt)}</span>
  },
  {
    id: 'warning',
    header: 'Cảnh báo',
    cell: ({ row }) => getWarningBadge(row.original),
    enableSorting: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
