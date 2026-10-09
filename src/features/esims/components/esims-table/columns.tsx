'use client';
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
import { callSmsSummary, hasCallOrSms, planDisplayName } from '@/features/plans/utils/plan-label';
import { PROVIDER_LABELS } from '@/features/overview/api/constants';

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
const PROVIDER_FILTER_OPTIONS = Object.entries(PROVIDER_LABELS).map(([value, label]) => ({
  value,
  label
}));

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
      label: 'ICCID',
      placeholder: 'Tìm kiếm ICCID...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    id: 'planName',
    // The filter still searches the stored name; only the display carries the
    // call/SMS allowance (#008).
    accessorFn: (row) => row.plan?.name ?? '',
    header: 'Tên gói',
    cell: ({ row }) => planDisplayName(row.original.plan),
    meta: {
      label: 'Tên gói',
      placeholder: 'Tìm kiếm tên gói...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    id: 'duration',
    accessorFn: (row) => row.plan?.durationDays,
    header: 'Thời hạn',
    cell: ({ row }) => {
      const durationDays = row.original.plan?.durationDays;
      return durationDays == null ? '—' : `${durationDays} ngày`;
    },
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
    cell: ({ row }) => row.original.provider || '—',
    enableColumnFilter: true,
    meta: {
      label: 'Nhà cung cấp',
      variant: 'multiSelect' as const,
      options: PROVIDER_FILTER_OPTIONS
    }
  },
  {
    // The plan's allowance, not the eSIM's own — an eSIM has no minutes of its
    // own, it inherits the plan's (#020).
    id: 'hasCallSms',
    accessorFn: (row) => (hasCallOrSms(row.plan) ? 'true' : 'false'),
    header: 'Call/SMS',
    cell: ({ row }) => (
      <Badge variant={hasCallOrSms(row.original.plan) ? 'default' : 'secondary'}>
        {hasCallOrSms(row.original.plan) ? 'Có' : 'Không'}
      </Badge>
    ),
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Call/SMS',
      variant: 'multiSelect' as const,
      options: YES_NO_OPTIONS
    }
  },
  {
    // The figures next to the Có/Không flag, laid out like the plans page (#022).
    id: 'callSmsDetail',
    accessorFn: (row) => callSmsSummary(row.plan) ?? '',
    header: 'SMS & Gọi điện',
    cell: ({ row }) => {
      const plan = row.original.plan;
      const minutes = Number(plan?.call) || 0;
      const sms = Number(plan?.sms) || 0;
      if (minutes === 0 && sms === 0) return <span className='text-muted-foreground'>—</span>;
      return (
        <div className='flex flex-col text-xs'>
          {minutes > 0 && <span>{minutes} phút gọi</span>}
          {sms > 0 && <span>{sms} SMS</span>}
        </div>
      );
    },
    enableSorting: false
  },
  {
    // "Can be topped up" — a property of the PLAN. Deliberately worded apart
    // from "Đã Topup" below, which is a fact about this eSIM (#025).
    id: 'topUp',
    accessorFn: (row) => (row.plan?.topUp ? 'true' : 'false'),
    header: 'Hỗ trợ Topup',
    cell: ({ row }) => (
      <Badge variant={row.original.plan?.topUp ? 'default' : 'secondary'}>
        {row.original.plan?.topUp ? 'Có' : 'Không'}
      </Badge>
    ),
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Hỗ trợ Topup',
      variant: 'multiSelect' as const,
      options: YES_NO_OPTIONS
    }
  },
  {
    // Whether this eSIM HAS been topped up (#025). Derived from the paid TOPUP
    // orders against its ICCID, so it is right for eSIMs topped up long ago.
    id: 'toppedUp',
    accessorFn: (row) => ((row.topupCount ?? 0) > 0 ? 'true' : 'false'),
    header: 'Đã Topup',
    cell: ({ row }) => {
      const count = row.original.topupCount ?? 0;
      if (count === 0) return <span className='text-muted-foreground'>—</span>;
      return (
        <div className='flex flex-col gap-1'>
          <Badge variant='default' className='w-fit'>
            Topup{count > 1 ? ` ×${count}` : ''}
          </Badge>
          {row.original.lastTopupAt && (
            <span className='text-muted-foreground text-xs'>
              {formatDateVn(row.original.lastTopupAt)}
            </span>
          )}
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'dataUsed',
    accessorKey: 'dataUsed',
    header: 'Dữ liệu đã dùng',
    cell: ({ row }) => (
      <span>
        {row.original.dataUsed} / {row.original.dataTotal}
      </span>
    ),
    enableSorting: false
  },
  {
    id: 'phoneNumber',
    accessorKey: 'phoneNumber',
    header: 'Số điện thoại',
    cell: ({ row }) => row.original.phoneNumber || '—'
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
      // A domestic eSIM has no end date (#024, test round 4).
      if (row.original.plan?.isDomesticEsim) return 'Vô thời hạn';
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
