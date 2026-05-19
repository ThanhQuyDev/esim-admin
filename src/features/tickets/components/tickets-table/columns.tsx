'use client';

import Link from 'next/link';
import type { Column, ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { StatusTag } from '../status-tag';
import { CellAction } from './cell-action';
import type { Ticket } from '../../api/types';

function truncate(value: string, max = 60) {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function formatDateTime(value: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
}

export const columns: ColumnDef<Ticket>[] = [
  {
    id: 'id',
    accessorKey: 'id',
    header: ({ column }: { column: Column<Ticket, unknown> }) => (
      <DataTableColumnHeader column={column} title='ID' />
    ),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/tickets/${row.original.id}`}
        className='font-medium tabular-nums hover:underline'
      >
        #{row.original.id}
      </Link>
    ),
    enableColumnFilter: false
  },
  {
    id: 'customerEmail',
    accessorKey: 'customerEmail',
    header: ({ column }: { column: Column<Ticket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Email khách hàng' />
    ),
    cell: ({ row }) => (
      <a
        href={`mailto:${row.original.customerEmail}`}
        className='text-primary inline-flex items-center gap-1 hover:underline'
      >
        <Icons.mail className='h-3.5 w-3.5' />
        <span className='truncate'>{row.original.customerEmail}</span>
      </a>
    ),
    enableSorting: false
  },
  {
    id: 'subject',
    accessorKey: 'subject',
    header: ({ column }: { column: Column<Ticket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tiêu đề' />
    ),
    cell: ({ row }) => {
      const subject = row.original.subject ?? '';
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='block max-w-[420px] truncate'>{truncate(subject, 60)}</span>
            </TooltipTrigger>
            <TooltipContent side='top' className='max-w-md'>
              <p className='whitespace-pre-wrap break-words'>{subject}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableSorting: false
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<Ticket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Trạng thái' />
    ),
    cell: ({ row }) => <StatusTag status={row.original.status} />,
    enableSorting: false
  },
  {
    id: 'orderId',
    accessorKey: 'orderId',
    header: 'Đơn hàng',
    cell: ({ row }) => {
      const orderId = row.original.orderId;
      if (!orderId) return <span className='text-muted-foreground'>—</span>;
      return (
        <Link
          href={`/dashboard/orders/${orderId}`}
          className={cn(
            'text-primary inline-flex items-center gap-1 font-mono text-xs hover:underline'
          )}
        >
          {orderId}
          <Icons.externalLink className='h-3 w-3' />
        </Link>
      );
    },
    enableSorting: false
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Ticket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày tạo' />
    ),
    cell: ({ row }) => (
      <span className='tabular-nums whitespace-nowrap'>
        {formatDateTime(row.original.createdAt)}
      </span>
    )
  },
  {
    id: 'actions',
    header: () => <span className='sr-only'>Hành động</span>,
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
