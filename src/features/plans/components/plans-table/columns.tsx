'use client';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Plan } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { formatDataSize } from '@/lib/format';

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
    accessorFn: (row) => row.destination?.name ?? row.countryCode,
    header: 'Điểm đến',
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
      <DataTableColumnHeader column={column} title='Tên gói' />
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
