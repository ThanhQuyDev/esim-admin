'use client';

import { esimDataLabel } from '../../lib/esim-data';
import { purchaseKindLabel, purchaseKindOf } from '@/lib/plan-purchase-kind';
import Link from 'next/link';
import { formatDateVn } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Esim } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import {
  ESIM_STATUS_OPTIONS,
  esimStatusLabel,
  esimStatusVariant,
  isExpiredStock
} from '../../lib/esim-status';
import { hasCallOrSms, planDisplayName } from '@/features/plans/utils/plan-label';
import { PROVIDER_LABELS, providerLabel } from '@/features/overview/api/constants';

/** The days the customer picked, or the plan's own, then what top-ups added. */
function esimTotalDays(esim: Esim): number | null {
  const days = esim.chosenDays && esim.chosenDays > 0 ? esim.chosenDays : esim.plan?.durationDays;
  return days == null ? null : days + (esim.addedDays ?? 0);
}

const packageTypeOptions = [
  { value: 'fixed', label: 'Cố định' },
  { value: 'daily', label: 'Theo ngày' },
  { value: 'unlimited', label: 'Không giới hạn' },
  { value: 'unlimited-reduce', label: 'Không giới hạn giảm tốc' }
];

const packageTypeLabel = new Map(packageTypeOptions.map((option) => [option.value, option.label]));

const YES_NO_OPTIONS = [
  { value: 'true', label: 'Có' },
  { value: 'false', label: 'Không' }
];

/** Real supplier names: this screen is admin-only (see PROVIDER_LABELS). */
// The bare "itel" only labels stock imported before vande #001; it is not a
// filter option of its own any more.
const PROVIDER_FILTER_OPTIONS = Object.entries(PROVIDER_LABELS)
  .filter(([value]) => value !== 'itel')
  .map(([value, label]) => ({ value, label }));

export const columns: ColumnDef<Esim>[] = [
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
    id: 'name',
    accessorKey: 'iccid',
    header: ({ column }: { column: Column<Esim, unknown> }) => (
      <DataTableColumnHeader column={column} title='ICCID' />
    ),
    cell: ({ row }) => <span className='font-mono text-xs'>{row.original.iccid}</span>,
    meta: {
      // One box for order number, email, ICCID and plan name (vande #021).
      label: 'Tìm kiếm',
      placeholder: 'Tìm theo mã đơn hàng, email, ICCID hoặc tên gói...',
      variant: 'text' as const,
      icon: Icons.search,
      inputClassName: 'h-8 w-full min-w-[16rem] md:w-[28rem]'
    },
    enableColumnFilter: true
  },
  {
    // Which order the eSIM came from (vande #021); opens that order.
    id: 'orderNumber',
    accessorKey: 'orderNumber',
    header: 'Mã đơn hàng',
    cell: ({ row }) =>
      row.original.orderNumber ? (
        <Link
          href={`/dashboard/orders?q=${encodeURIComponent(row.original.orderNumber)}&status=all`}
          className='font-mono text-xs underline-offset-2 hover:underline'
          data-testid='esim-order-number'
        >
          {row.original.orderNumber}
        </Link>
      ) : (
        <span className='text-muted-foreground text-xs'>—</span>
      ),
    enableSorting: false,
    enableColumnFilter: false
  },
  {
    id: 'planName',
    // The filter still searches the stored name; only the display carries the
    // call/SMS allowance (#008).
    accessorFn: (row) => row.plan?.name ?? '',
    header: 'Tên gói',
    cell: ({ row }) => planDisplayName(row.original.plan, '—', row.original.chosenDays),
    // Searched through the one box above (vande #021).
    enableColumnFilter: false,
    enableSorting: false
  },
  {
    id: 'packageType',
    accessorFn: (row) => row.plan?.type ?? '',
    header: 'Loại gói',
    cell: ({ row }) => {
      const type = row.original.plan?.type;
      return type ? <Badge variant='outline'>{packageTypeLabel.get(type) ?? type}</Badge> : '—';
    },
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Loại gói',
      variant: 'multiSelect' as const,
      options: packageTypeOptions
    }
  },
  {
    // `esimStatus`, not `status`: the data table names its URL param after the
    // column id, and `status` is already taken by the shared search-params cache
    // as a SINGLE string (orders, tickets). Reusing it would make the server
    // unable to parse this multi-select.
    id: 'esimStatus',
    accessorKey: 'status',
    header: 'Trạng thái',
    // The lifecycle status (#024): "Đang dùng" / "Hết hạn" follow from the
    // activation and expiry dates, which the stored status never recorded.
    cell: ({ row }) => {
      const status = row.original.lifecycleStatus ?? row.original.status;
      return <Badge variant={esimStatusVariant(status)}>{esimStatusLabel(status)}</Badge>;
    },
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Trạng thái',
      variant: 'multiSelect' as const,
      options: ESIM_STATUS_OPTIONS
    }
  },
  {
    id: 'provider',
    accessorKey: 'provider',
    header: 'Nhà cung cấp',
    cell: ({ row }) => providerLabel(row.original.provider),
    enableColumnFilter: true,
    meta: {
      label: 'Nhà cung cấp',
      variant: 'multiSelect' as const,
      options: PROVIDER_FILTER_OPTIONS
    }
  },
  {
    id: 'duration',
    // The days the customer picked, then what top-ups added (vande-0411 #035).
    accessorFn: (row) => esimTotalDays(row),
    header: 'Thời hạn',
    cell: ({ row }) => {
      const durationDays = esimTotalDays(row.original);
      return durationDays == null ? '—' : `${durationDays} ngày`;
    },
    enableSorting: false
  },
  {
    // Rounded here, exact on the eSIM's page (vande-0411 #047).
    id: 'dataUsed',
    accessorKey: 'dataUsed',
    header: 'Dữ liệu đã dùng',
    cell: ({ row }) => <span className='whitespace-nowrap'>{esimDataLabel(row.original)}</span>,
    enableSorting: false
  },
  {
    // One column, with the figures when it has any (vande-0411 #047). The plan's
    // allowance: an eSIM has no minutes of its own (#020).
    id: 'hasCallSms',
    accessorFn: (row) => (hasCallOrSms(row.plan) ? 'true' : 'false'),
    header: 'Call/SMS',
    cell: ({ row }) => {
      const plan = row.original.plan;
      const minutes = Number(plan?.call) || 0;
      const sms = Number(plan?.sms) || 0;
      if (minutes === 0 && sms === 0) return <Badge variant='secondary'>Không</Badge>;
      return (
        <div className='flex flex-col text-xs'>
          {minutes > 0 && <span>{minutes} phút gọi</span>}
          {sms > 0 && <span>{sms} SMS</span>}
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Call/SMS',
      variant: 'multiSelect' as const,
      options: YES_NO_OPTIONS
    }
  },
  {
    // What the plan takes, then when this eSIM last had one (vande-0411 #047).
    id: 'topUp',
    accessorFn: (row) => (row.plan?.topUp ? 'true' : 'false'),
    header: 'Topup / Addon',
    cell: ({ row }) => {
      const count = row.original.topupCount ?? 0;
      return (
        <div className='flex flex-col gap-1'>
          <Badge
            variant={purchaseKindOf(row.original.plan) === 'none' ? 'secondary' : 'default'}
            className='w-fit'
          >
            {purchaseKindLabel(row.original.plan)}
            {count > 1 ? ` ×${count}` : ''}
          </Badge>
          {count > 0 && row.original.lastTopupAt && (
            <span className='text-muted-foreground text-xs' data-testid='esim-last-topup'>
              {formatDateVn(row.original.lastTopupAt)}
            </span>
          )}
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Hỗ trợ Topup',
      variant: 'multiSelect' as const,
      options: YES_NO_OPTIONS
    }
  },
  // The "Roaming" column is gone (#022): it said nothing useful about an eSIM,
  // and its place is taken by Call/SMS + SMS & Gọi điện above.
  {
    id: 'expiresAt',
    accessorKey: 'expiresAt',
    header: ({ column }: { column: Column<Esim, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày hết hạn' />
    ),
    cell: ({ row }) => {
      const date = row.original.expiresAt;
      // Domestic eSIMs show their real end date too — the "Expried Time" of
      // the import file (vande #002); they used to read "Vô thời hạn".
      if (!date) return '—';
      // Unsold stock that has already expired is dead: delivery now refuses it
      // (#021), so it has to be visible instead of sitting in the list looking
      // like sellable stock.
      if (isExpiredStock(row.original)) {
        return (
          <div className='flex flex-col gap-1'>
            <span className='text-destructive font-medium'>{formatDateVn(date)}</span>
            <Badge variant='destructive' className='w-fit'>
              Đã hết hạn — không bán được
            </Badge>
          </div>
        );
      }
      // The same column means two different things, which is what #021 asks to
      // be made clear: before activation it is the deadline to activate by (the
      // supplier's 30/60/90/180-day window), and once the eSIM has connected it
      // is the end of the plan's own period.
      return (
        <div className='flex flex-col'>
          <span>{formatDateVn(date)}</span>
          <span className='text-muted-foreground text-xs'>
            {row.original.activatedAt ? 'Hết hạn sử dụng' : 'Hạn kích hoạt'}
          </span>
        </div>
      );
    }
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Esim, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày tạo' />
    ),
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return date ? formatDateVn(date) : '—';
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
