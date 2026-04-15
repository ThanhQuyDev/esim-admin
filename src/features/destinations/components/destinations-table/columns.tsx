'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Destination } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Destination>[] = [
  {
    id: 'flag',
    accessorKey: 'flagUrl',
    header: 'Cờ',
    cell: ({ row }) => {
      const flagUrl = row.original.flagUrl;
      return flagUrl ? (
        <img src={flagUrl} alt={row.original.name} className='h-6 w-8 rounded object-cover' />
      ) : (
        <span className='text-muted-foreground text-xs'>—</span>
      );
    },
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Destination, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tên' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.name}</span>
        <span className='text-muted-foreground text-xs'>{row.original.slug}</span>
      </div>
    ),
    meta: {
      label: 'Tên',
      placeholder: 'Tìm kiếm điểm đến...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'countryCode',
    accessorKey: 'countryCode',
    header: ({ column }: { column: Column<Destination, unknown> }) => (
      <DataTableColumnHeader column={column} title='Mã quốc gia' />
    ),
    cell: ({ row }) => <Badge variant='outline'>{row.original.countryCode}</Badge>
  },
  {
    id: 'isPopular',
    accessorKey: 'isPopular',
    header: 'Nổi bật',
    cell: ({ row }) => (
      <Badge variant={row.original.isPopular ? 'default' : 'secondary'}>
        {row.original.isPopular ? 'Có' : 'Không'}
      </Badge>
    ),
    enableSorting: false
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
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
