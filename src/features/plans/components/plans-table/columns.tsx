'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Plan } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Plan>[] = [
  {
    id: 'destination',
    accessorFn: (row) => row.destination?.name ?? row.countryCode,
    header: 'Destination',
    cell: ({ row }) => {
      const dest = row.original.destination;
      return (
        <div className='flex items-center gap-2'>
          {dest?.flagUrl && (
            <img src={dest.flagUrl} alt={dest.name} className='h-5 w-7 rounded object-cover' />
          )}
          <span className='text-sm'>{dest?.name ?? row.original.countryCode}</span>
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Plan, unknown> }) => (
      <DataTableColumnHeader column={column} title='Plan Name' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.name}</span>
        <span className='text-muted-foreground text-xs'>
          {row.original.provider} · {row.original.type}
        </span>
      </div>
    ),
    meta: {
      label: 'Name',
      placeholder: 'Search plans...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'duration',
    accessorKey: 'durationDays',
    header: ({ column }: { column: Column<Plan, unknown> }) => (
      <DataTableColumnHeader column={column} title='Duration' />
    ),
    cell: ({ row }) => <span>{row.original.durationDays} days</span>
  },
  {
    id: 'data',
    accessorKey: 'dataGb',
    header: 'Data',
    cell: ({ row }) => {
      const gb = parseFloat(row.original.dataGb);
      return <span>{gb > 0 ? `${gb} GB` : 'Unlimited'}</span>;
    },
    enableSorting: false
  },
  {
    id: 'price',
    accessorKey: 'price',
    header: ({ column }: { column: Column<Plan, unknown> }) => (
      <DataTableColumnHeader column={column} title='Price' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>
          ${row.original.price} {row.original.currency}
        </span>
        <span className='text-muted-foreground text-xs'>
          Cost: ${row.original.costPrice} · Retail: ${row.original.retailPrice}
        </span>
      </div>
    )
  },
  {
    id: 'topUp',
    accessorKey: 'topUp',
    header: 'Top-Up',
    cell: ({ row }) => (
      <Badge variant={row.original.topUp ? 'default' : 'secondary'}>
        {row.original.topUp ? 'Yes' : 'No'}
      </Badge>
    ),
    enableSorting: false
  },
  {
    id: 'isCheapest',
    accessorFn: (row) => (row.isCheapest ? 'true' : 'false'),
    header: 'Cheapest',
    cell: ({ row }) => (
      <Badge variant={row.original.isCheapest ? 'default' : 'secondary'}>
        {row.original.isCheapest ? 'Yes' : 'No'}
      </Badge>
    ),
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Cheapest',
      variant: 'multiSelect' as const,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ]
    }
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
