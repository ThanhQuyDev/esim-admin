'use client';

import type { Column, ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import { formatDateVn } from '@/lib/format';
import { formatVnd } from '@/lib/format';

import { cn } from '@/lib/utils';

import type { MyOrder, MyOrderItem } from '../../api/types';

/**
 * Commission lifecycle, with the light/dark pairs the admin console uses for
 * semantic status (see `features/tickets/constants/status.ts`). Colour never
 * carries the meaning alone — the label does.
 */
export const COMMISSION_STATUS: Record<string, { label: string; className: string }> = {
  credited: {
    label: 'Đã duyệt',
    className:
      'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
  },
  pending: {
    // The brief's own words for the 24h hold (#019, #022).
    label: 'Chờ xác nhận',
    className:
      'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300'
  },
  reversed: {
    label: 'Đơn hoàn tiền',
    className:
      'border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
  }
};

export const COMMISSION_STATUS_OPTIONS = Object.entries(COMMISSION_STATUS).map(
  ([value, { label }]) => ({ value, label })
);

/**
 * The products in one order (#023).
 *
 * Two names fit in the column; the rest hide behind a "+N" the partner can
 * open, with each line's price beside it. A refunded product is greyed and
 * labelled rather than removed — the partner needs to see why the commission
 * on this order is smaller than the order looks.
 */
function ProductLine({ item }: { item: MyOrderItem }) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3 text-sm',
        item.refunded && 'text-muted-foreground'
      )}
    >
      <span className={cn('truncate', item.refunded && 'line-through')}>
        {item.planName}
        {item.quantity > 1 && ` ×${item.quantity}`}
      </span>
      <span className='flex shrink-0 items-center gap-2'>
        {item.refunded && (
          <Badge variant='secondary' className='px-1.5 py-0 text-[10px]'>
            Hoàn
          </Badge>
        )}
        <span className='tabular-nums'>{item.vndPrice ? formatVnd(item.vndPrice) : '—'}</span>
      </span>
    </div>
  );
}

function OrderProducts({ items, createdAt }: { items: MyOrderItem[]; createdAt: string }) {
  const shown = items.slice(0, 2);
  const hidden = items.length - shown.length;

  return (
    <div className='min-w-0 space-y-1'>
      {shown.map((item, index) => (
        <ProductLine key={`${item.planName}-${index}`} item={item} />
      ))}
      {items.length === 0 && <p className='text-sm'>—</p>}
      {hidden > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='ghost' size='sm' className='h-6 px-1.5 text-xs'>
              <Icons.add className='mr-1 size-3' />
              {hidden} sản phẩm khác
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-80 space-y-1'>
            <p className='text-muted-foreground mb-2 text-xs'>{items.length} sản phẩm trong đơn</p>
            {items.map((item, index) => (
              <ProductLine key={`all-${item.planName}-${index}`} item={item} />
            ))}
          </PopoverContent>
        </Popover>
      )}
      <p className='text-muted-foreground text-xs'>{formatDateVn(createdAt)}</p>
    </div>
  );
}

export const SOURCE_OPTIONS = [
  { value: 'link', label: 'Liên kết tiếp thị' },
  { value: 'code', label: 'Mã đối tác' }
];

export const columns: ColumnDef<MyOrder>[] = [
  {
    id: 'orderNumber',
    accessorKey: 'orderNumber',
    header: ({ column }: { column: Column<MyOrder, unknown> }) => (
      <DataTableColumnHeader column={column} title='Mã đơn' />
    ),
    cell: ({ row }) => (
      <span className='font-mono text-xs font-semibold'>#{row.original.orderNumber}</span>
    ),
    meta: {
      label: 'Mã đơn',
      placeholder: 'Tìm mã đơn hoặc sản phẩm...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    id: 'product',
    // Its own filter (#022): searching a plan name through the order-code box
    // worked, but nobody would guess that is where to type it.
    accessorFn: (row) => row.items.map((i) => i.planName).join(' '),
    header: 'Sản phẩm',
    enableColumnFilter: true,
    meta: {
      label: 'Sản phẩm',
      placeholder: 'Tên gói...',
      variant: 'text' as const
    },
    cell: ({ row }) => (
      <OrderProducts items={row.original.items} createdAt={row.original.createdAt} />
    ),
    enableSorting: false
  },
  {
    id: 'vndPrice',
    accessorKey: 'vndPrice',
    header: 'Giá trị',
    // Net of refunds (#018); the original is kept beside it so a partner can
    // see why the number moved rather than doubting the report.
    cell: ({ row }) => {
      const refunded = row.original.refundedVnd ?? 0;
      return (
        <div className='flex flex-col'>
          <span className='tabular-nums'>{formatVnd(row.original.vndPrice)}</span>
          {refunded > 0 && (
            <span className='text-muted-foreground text-xs line-through'>
              {formatVnd(row.original.grossVndPrice ?? row.original.vndPrice + refunded)}
            </span>
          )}
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'customerType',
    // A partner bringing first-time buyers is doing something different from
    // one re-selling to the same people (#021).
    accessorFn: (row) => row.customerType ?? 'returning',
    header: 'Khách hàng',
    cell: ({ row }) =>
      row.original.customerType === 'new' ? (
        <Badge variant='secondary'>Khách mới</Badge>
      ) : (
        <Badge variant='outline'>Khách quay lại</Badge>
      ),
    enableColumnFilter: true,
    meta: {
      label: 'Khách hàng',
      variant: 'multiSelect' as const,
      options: [
        { value: 'new', label: 'Khách mới' },
        { value: 'returning', label: 'Khách quay lại' }
      ]
    },
    enableSorting: false
  },
  {
    id: 'source',
    // The toolbar only builds a filter for a column it can read a value from,
    // and attribution is derived rather than stored as its own field.
    accessorFn: (row) => (row.linkCode ? 'link' : 'code'),
    header: 'Nguồn ghi nhận',
    // The path is what the partner handed out, so print it as such (#024) —
    // /go/<code>, which is the route the site really serves.
    cell: ({ row }) =>
      row.original.linkCode ? (
        <div className='flex min-w-0 items-center gap-2'>
          <Badge variant='secondary'>Link</Badge>
          <span className='text-muted-foreground truncate font-mono text-xs'>
            /go/{row.original.linkCode}
          </span>
        </div>
      ) : (
        <div className='flex min-w-0 items-center gap-2'>
          <Badge variant='outline'>Mã</Badge>
          <span className='text-muted-foreground truncate font-mono text-xs'>
            {row.original.couponCode ?? '—'}
          </span>
        </div>
      ),
    meta: {
      label: 'Nguồn ghi nhận',
      variant: 'multiSelect' as const,
      options: SOURCE_OPTIONS
    },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    id: 'esimCount',
    accessorKey: 'esimCount',
    header: 'eSIM',
    cell: ({ row }) => <span className='tabular-nums'>{row.original.esimCount}</span>,
    enableSorting: false
  },
  {
    id: 'commissionPercent',
    accessorKey: 'commissionPercent',
    header: '% hoa hồng',
    cell: ({ row }) => (
      <span className='tabular-nums'>
        {row.original.commissionPercent == null ? '—' : `${row.original.commissionPercent}%`}
      </span>
    ),
    enableSorting: false
  },
  {
    id: 'commissionVnd',
    accessorKey: 'commissionVnd',
    header: 'Hoa hồng',
    cell: ({ row }) => (
      <span className='font-medium tabular-nums'>{formatVnd(row.original.commissionVnd ?? 0)}</span>
    ),
    enableSorting: false
  },
  {
    id: 'commissionStatus',
    accessorKey: 'commissionStatus',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const status = COMMISSION_STATUS[row.original.commissionStatus ?? ''];
      if (!status) return <Badge variant='outline'>{row.original.status}</Badge>;
      return (
        <Badge variant='outline' className={status.className}>
          {status.label}
        </Badge>
      );
    },
    meta: {
      label: 'Trạng thái hoa hồng',
      variant: 'multiSelect' as const,
      options: COMMISSION_STATUS_OPTIONS
    },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Ngày đặt hàng',
    cell: ({ row }) => (
      <span className='text-sm whitespace-nowrap'>{formatDateVn(row.original.createdAt)}</span>
    ),
    enableSorting: false
  },
  {
    id: 'actions',
    header: '',
    // The dialog belongs to the table, which hands the opener down through the
    // table meta rather than every row carrying its own state.
    cell: ({ row, table }) => (
      <Button
        size='sm'
        variant='ghost'
        onClick={() =>
          (
            table.options.meta as { onViewDetail?: (orderNumber: string) => void } | undefined
          )?.onViewDetail?.(row.original.orderNumber)
        }
      >
        Xem chi tiết
      </Button>
    ),
    enableSorting: false
  }
];
