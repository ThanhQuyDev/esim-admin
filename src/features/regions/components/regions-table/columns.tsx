'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Region } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Region>[] = [
  {
    id: 'avatar',
    accessorKey: 'avatarUrl',
    header: 'Avatar',
    cell: ({ row }) => {
      const avatarUrl = row.original.avatarUrl;
      return avatarUrl ? (
        <img
          src={avatarUrl}
          alt={row.original.name}
          className='h-8 w-8 rounded-full object-cover'
        />
      ) : (
        <span className='text-muted-foreground text-xs'>—</span>
      );
    },
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Region, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.name}</span>
        <span className='text-muted-foreground text-xs'>{row.original.slug}</span>
      </div>
    ),
    meta: {
      label: 'Name',
      placeholder: 'Search regions...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'children',
    accessorFn: (row) => row.destinationCount ?? 0,
    header: 'Countries',
    cell: ({ row }) => (
      <Badge variant='outline'>{row.original.destinationCount ?? 0} countries</Badge>
    ),
    enableSorting: false
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Active',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
    enableSorting: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
