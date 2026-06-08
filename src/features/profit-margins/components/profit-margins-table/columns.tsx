'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import type { ProfitMarginTier } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
}

export const columns: ColumnDef<ProfitMarginTier>[] = [
  {
    id: 'minVnd',
    accessorKey: 'minVnd',
    header: ({ column }: { column: Column<ProfitMarginTier, unknown> }) => (
      <DataTableColumnHeader column={column} title='Min Price (VND)' />
    ),
    cell: ({ row }) => (
      <div className='font-medium tabular-nums'>{formatVnd(row.original.minVnd)}</div>
    ),
    meta: { label: 'Min Price (VND)', variant: 'text' as const }
  },
  {
    id: 'maxVnd',
    accessorKey: 'maxVnd',
    header: ({ column }: { column: Column<ProfitMarginTier, unknown> }) => (
      <DataTableColumnHeader column={column} title='Max Price (VND)' />
    ),
    cell: ({ row }) => <div className='tabular-nums'>{formatVnd(row.original.maxVnd)}</div>,
    meta: { label: 'Max Price (VND)', variant: 'text' as const }
  },
  {
    id: 'percentage',
    accessorKey: 'percentage',
    header: ({ column }: { column: Column<ProfitMarginTier, unknown> }) => (
      <DataTableColumnHeader column={column} title='Profit %' />
    ),
    cell: ({ row }) => <div className='tabular-nums'>{row.original.percentage}%</div>,
    meta: { label: 'Profit %', variant: 'text' as const }
  },
  {
    id: 'fixedAmountVnd',
    accessorKey: 'fixedAmountVnd',
    header: ({ column }: { column: Column<ProfitMarginTier, unknown> }) => (
      <DataTableColumnHeader column={column} title='Phụ thu cố định' />
    ),
    cell: ({ row }) => {
      const amount = row.original.fixedAmountVnd;
      return amount && amount > 0 ? (
        <div className='tabular-nums font-medium'>{formatVnd(amount)}</div>
      ) : (
        <span className='text-muted-foreground'>—</span>
      );
    },
    meta: { label: 'Phụ thu cố định', variant: 'text' as const }
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
    enableSorting: false,
    meta: {
      label: 'Status',
      variant: 'text' as const,
      icon: Icons.circleCheck
    }
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<ProfitMarginTier, unknown> }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('vi-VN')
  },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
];
