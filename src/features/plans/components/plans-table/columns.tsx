'use client';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Plan } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { formatDataSize } from '@/lib/format';

function CopyIdButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <button
      type='button'
      onClick={handleCopy}
      title={copied ? 'Đã copy!' : `Copy: ${value}`}
      className='text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center rounded p-0.5 transition-colors'
      aria-label={`Copy ID: ${value}`}
    >
      {copied ? (
        <Icons.check className='size-3.5 text-green-500' />
      ) : (
        <Icons.copy className='size-3.5' />
      )}
    </button>
  );
}

export const columns: ColumnDef<Plan>[] = [
  {
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
    id: 'destination',
    accessorFn: (row) => row.region?.name ?? row.destination?.name ?? row.countryCode,
    header: 'Điểm đến',
    cell: ({ row }) => {
      const dest = row.original.destination;
      const region = row.original.region;

      if (region && region.destinations && region.destinations.length > 0) {
        return (
          <div className='flex items-center gap-2'>
            {region.avatarUrl && (
              <img
                src={region.avatarUrl}
                alt={region.name}
                className='h-5 w-7 rounded object-cover'
              />
            )}
            <span className='text-sm font-medium'>{region.name}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='ghost' size='sm' className='h-6 px-1.5 text-xs'>
                  <Icons.eye className='mr-1 size-3' />
                  {region.destinations.length} nước
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-64 p-0' align='start'>
                <div className='border-b px-3 py-2'>
                  <p className='text-sm font-medium'>{region.name}</p>
                  <p className='text-muted-foreground text-xs'>
                    {region.destinations.length} điểm đến
                  </p>
                </div>
                <div className='max-h-60 overflow-y-auto p-2'>
                  <div className='grid gap-1'>
                    {region.destinations.map((d) => (
                      <div key={d.id} className='flex items-center gap-2 rounded px-2 py-1'>
                        {d.flagUrl && (
                          <img
                            src={d.flagUrl}
                            alt={d.name}
                            className='h-4 w-5 shrink-0 rounded object-cover'
                          />
                        )}
                        <span className='text-sm'>{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        );
      }

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
    id: 'provider',
    accessorKey: 'provider',
    header: 'Nhà cung cấp',
    cell: ({ row }) => {
      const provider = row.original.provider;
      return (
        <Badge variant='outline' className='capitalize'>
          {provider || '—'}
        </Badge>
      );
    },
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Nhà cung cấp',
      variant: 'multiSelect' as const,
      options: [
        { value: 'esimaccess', label: 'EsimAccess' },
        { value: 'airalo', label: 'Airalo' },
        { value: 'gadgetkorea', label: 'Gadget Korea' },
        { value: 'japantravelsim', label: 'Japan Travel SIM' },
        { value: 'viettel', label: 'Viettel' }
      ]
    }
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Plan, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tên gói' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.name}</span>
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <span>{row.original.providerPlanId}</span>
          <CopyIdButton value={row.original.providerPlanId} />
        </div>
      </div>
    ),
    meta: {
      label: 'Tên',
      placeholder: 'Tìm kiếm gói...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'duration',
    accessorKey: 'durationDays',
    header: ({ column }: { column: Column<Plan, unknown> }) => (
      <DataTableColumnHeader column={column} title='Thời hạn' />
    ),
    cell: ({ row }) => <span>{row.original.durationDays} ngày</span>
  },
  {
    id: 'data',
    accessorKey: 'dataMb',
    header: 'Dữ liệu',
    cell: ({ row }) => {
      const mb = row.original.dataMb;
      return <span>{formatDataSize(mb)}</span>;
    },
    enableSorting: false
  },
  {
    id: 'sms',
    accessorKey: 'sms',
    header: 'SMS',
    cell: ({ row }) => <span>{row.original.sms != null ? row.original.sms : '—'}</span>,
    enableSorting: false
  },
  {
    id: 'call',
    accessorKey: 'call',
    header: 'Gọi điện',
    cell: ({ row }) => <span>{row.original.call != null ? `${row.original.call} phút` : '—'}</span>,
    enableSorting: false
  },
  {
    id: 'price',
    accessorKey: 'price',
    header: ({ column }: { column: Column<Plan, unknown> }) => (
      <DataTableColumnHeader column={column} title='Giá' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>
          ${row.original.price} {row.original.currency}
        </span>
        <span className='text-muted-foreground text-xs'>
          Giá gốc: ${row.original.costPrice} · Giá bán: ${row.original.retailPrice}
        </span>
      </div>
    )
  },
  {
    id: 'discount',
    accessorKey: 'discount',
    header: 'Discount',
    cell: ({ row }) => {
      const discount = row.original.discount;
      return discount != null ? `${discount}%` : '—';
    },
    enableSorting: false
  },
  {
    id: 'topUp',
    accessorKey: 'topUp',
    header: 'Top-Up',
    cell: ({ row }) => (
      <Badge variant={row.original.topUp ? 'default' : 'secondary'}>
        {row.original.topUp ? 'Có' : 'Không'}
      </Badge>
    ),
    enableSorting: false
  },
  {
    id: 'isCheapest',
    accessorFn: (row) => (row.isCheapest ? 'true' : 'false'),
    header: 'Rẻ nhất',
    cell: ({ row }) => (
      <Badge variant={row.original.isCheapest ? 'default' : 'secondary'}>
        {row.original.isCheapest ? 'Có' : 'Không'}
      </Badge>
    ),
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Rẻ nhất',
      variant: 'multiSelect' as const,
      options: [
        { value: 'true', label: 'Có' },
        { value: 'false', label: 'Không' }
      ]
    }
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
