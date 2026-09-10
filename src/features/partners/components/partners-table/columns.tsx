'use client';
import { Badge } from '@/components/ui/badge';
import { formatDateVn, formatVnd } from '@/lib/format';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Partner } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { PartnerCellAction } from './cell-action';

const PARTNER_TYPE_LABEL: Record<string, string> = {
  distribution: 'Đối tác phân phối',
  kol: 'KOL'
};

const STATUS_VARIANT: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  pending: 'secondary',
  active: 'default',
  hold: 'outline',
  disabled: 'destructive',
  rejected: 'destructive'
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  hold: 'Tạm giữ',
  disabled: 'Đã khóa',
  rejected: 'Bị từ chối'
};

export const columns: ColumnDef<Partner>[] = [
  {
    // "ID đối tác" — reconciliation queries and support tickets refer to
    // partners by id, and it was the one identifier the list did not show (#095).
    id: 'partnerId',
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <span className='text-muted-foreground font-mono text-xs'>#{row.original.id}</span>
    ),
    enableSorting: false
  },
  {
    id: 'name',
    accessorFn: (row) => row.contactName,
    header: ({ column }: { column: Column<Partner, unknown> }) => (
      <DataTableColumnHeader column={column} title='Đối tác' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='text-sm font-medium'>{row.original.contactName}</span>
        <span className='text-muted-foreground text-xs'>{row.original.contactEmail}</span>
      </div>
    ),
    meta: {
      label: 'Tên/Email',
      placeholder: 'Tìm theo tên, email, công ty...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    id: 'partnerType',
    accessorKey: 'partnerType',
    header: 'Loại',
    cell: ({ row }) => (
      <Badge variant='outline'>
        {PARTNER_TYPE_LABEL[row.original.partnerType] ?? row.original.partnerType}
      </Badge>
    ),
    enableSorting: false
  },
  {
    id: 'companyName',
    accessorKey: 'companyName',
    header: 'Công ty',
    cell: ({ row }) => row.original.companyName || '—'
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
          {STATUS_LABEL[status] ?? status}
        </Badge>
      );
    },
    enableSorting: false
  },
  {
    id: 'tierCode',
    accessorKey: 'tierCode',
    header: 'Hạng',
    cell: ({ row }) => row.original.tierCode || '—'
  },
  {
    accessorKey: 'totalOrders',
    header: 'Tổng đơn',
    cell: ({ row }) => <span className='text-sm tabular-nums'>{row.original.totalOrders ?? 0}</span>
  },
  {
    accessorKey: 'totalRevenueVnd',
    header: 'Tổng doanh thu',
    cell: ({ row }) => (
      <span className='text-sm tabular-nums'>{formatVnd(row.original.totalRevenueVnd ?? 0)}</span>
    )
  },
  {
    // What we have actually paid this partner, which is the figure a payout
    // conversation starts from (#095).
    accessorKey: 'totalCommissionVnd',
    header: 'Tổng hoa hồng',
    cell: ({ row }) => (
      <span className='text-sm tabular-nums'>
        {formatVnd(row.original.totalCommissionVnd ?? 0)}
      </span>
    )
  },
  {
    accessorKey: 'profitVnd',
    header: 'Lợi nhuận',
    cell: ({ row }) => {
      // Revenue less cost of goods less the commission paid to this partner, so
      // it can legitimately be negative — a refunded month, or a rate set too
      // high. Showing that in red is the whole point of the column.
      const profit = row.original.profitVnd ?? 0;
      return (
        <span className={`text-sm tabular-nums ${profit < 0 ? 'text-destructive' : ''}`}>
          {formatVnd(profit)}
        </span>
      );
    }
  },
  {
    accessorKey: 'refundRatePercent',
    header: 'Tỷ lệ hoàn tiền',
    cell: ({ row }) => {
      const rate = row.original.refundRatePercent ?? 0;
      return (
        <span
          className={`text-sm tabular-nums ${rate >= 10 ? 'text-destructive font-medium' : ''}`}
        >
          {rate}%
        </span>
      );
    }
  },
  {
    accessorKey: 'revenue30dVnd',
    header: 'Giá trị 30 ngày',
    cell: ({ row }) => <span className='text-sm'>{formatVnd(row.original.revenue30dVnd ?? 0)}</span>
  },
  {
    accessorKey: 'walletBalanceVnd',
    header: 'Số dư ví',
    cell: ({ row }) => (
      <span className='text-sm'>{formatVnd(row.original.walletBalanceVnd ?? 0)}</span>
    )
  },
  {
    accessorKey: 'lastActivityAt',
    header: 'Hoạt động gần nhất',
    cell: ({ row }) =>
      row.original.lastActivityAt ? (
        <span className='text-sm'>{formatDateVn(row.original.lastActivityAt)}</span>
      ) : (
        <span className='text-muted-foreground text-sm'>—</span>
      )
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Partner, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày đăng ký' />
    ),
    cell: ({ row }) => formatDateVn(row.original.createdAt)
  },
  {
    id: 'actions',
    cell: ({ row }) => <PartnerCellAction data={row.original} />
  }
];
