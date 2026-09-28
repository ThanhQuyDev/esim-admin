'use client';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateVn, formatVnd } from '@/lib/format';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Partner } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { PartnerCellAction } from './cell-action';

/** The partner's main sales channel, out of the free-form apply payload (#060). */
function mainChannel(channelInfo: Record<string, unknown> | null | undefined): string {
  if (!channelInfo) return '—';
  const entries = Object.entries(channelInfo).filter(
    ([, value]) => typeof value === 'string' && value.trim()
  );
  if (entries.length === 0) return '—';
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(' · ');
}

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

function buildColumns(tierCodes: string[]): ColumnDef<Partner>[] {
  return [
    {
      // Ticking rows is what makes the bulk status change possible (#059).
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Chọn tất cả'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Chọn dòng'
        />
      ),
      enableSorting: false,
      enableHiding: false
    },
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
          <span className='text-sm font-medium'>
            {row.original.companyName || row.original.contactName}
          </span>
          <span className='text-muted-foreground font-mono text-xs'>#{row.original.id}</span>
          <span className='text-muted-foreground text-xs'>{row.original.contactEmail}</span>
          <span className='text-muted-foreground text-xs'>{row.original.contactPhone}</span>
        </div>
      ),
      meta: {
        label: 'Tên/Email/SĐT/ID',
        // The server matches the id too, so an admin can paste what a
        // reconciliation file or a support ticket quotes back (#058).
        placeholder: 'Tìm tên, email, SĐT, công ty hoặc ID...',
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
      meta: {
        label: 'Loại đối tác',
        variant: 'select' as const,
        options: Object.entries(PARTNER_TYPE_LABEL).map(([value, label]) => ({
          value,
          label
        }))
      },
      enableColumnFilter: true,
      enableSorting: false
    },
    {
      id: 'legalType',
      accessorKey: 'legalType',
      header: 'Pháp nhân',
      cell: ({ row }) => (
        <span className='text-xs'>
          {row.original.legalType === 'company' ? 'Công ty' : 'Cá nhân'}
        </span>
      ),
      enableSorting: false
    },
    {
      id: 'channel',
      header: 'Kênh bán',
      cell: ({ row }) => (
        <span className='text-muted-foreground line-clamp-2 max-w-[200px] text-xs'>
          {mainChannel(row.original.channelInfo)}
        </span>
      ),
      enableSorting: false
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
      meta: {
        label: 'Trạng thái',
        variant: 'select' as const,
        options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))
      },
      enableColumnFilter: true,
      enableSorting: false
    },
    {
      id: 'tierCode',
      accessorKey: 'tierCode',
      header: 'Hạng',
      cell: ({ row }) => row.original.tierCode || '—',
      meta: {
        label: 'Hạng đối tác',
        // Filled from the tiers the programme actually has, so a renamed or a
        // newly added tier needs no change here (#058).
        variant: 'select' as const,
        options: tierCodes.map((code) => ({ value: code, label: code }))
      },
      enableColumnFilter: true,
      enableSorting: false
    },
    {
      id: 'finance',
      header: 'Tài chính',
      cell: ({ row }) => {
        // A marketing partner's wallet is their commission; a distribution
        // partner's is the deposit they buy stock from. Same column, and the
        // label says which, so the two are never read as the same money (#060).
        const isKol = row.original.partnerType === 'kol';
        return (
          <div className='flex flex-col'>
            <span className='text-sm tabular-nums'>
              {formatVnd(row.original.availableBalanceVnd ?? 0)}
            </span>
            <span className='text-muted-foreground text-xs'>
              {isKol ? 'Hoa hồng khả dụng' : 'Số dư ký quỹ'}
            </span>
          </div>
        );
      },
      enableSorting: false
    },
    {
      id: 'lastActivityAt',
      header: 'Hoạt động gần nhất',
      cell: ({ row }) => {
        const at = row.original.lastLoginAt ?? row.original.lastActivityAt;
        return (
          <div className='flex flex-col'>
            <span className='text-xs'>{at ? formatDateVn(at) : 'Chưa đăng nhập'}</span>
            {at && <span className='text-muted-foreground text-xs'>Lần đăng nhập gần nhất</span>}
          </div>
        );
      },
      enableSorting: false
    },
    {
      accessorKey: 'totalOrders',
      header: 'Tổng đơn',
      cell: ({ row }) => (
        <span className='text-sm tabular-nums'>{row.original.totalOrders ?? 0}</span>
      )
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
      cell: ({ row }) => (
        <span className='text-sm'>{formatVnd(row.original.revenue30dVnd ?? 0)}</span>
      )
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
}

/**
 * Column definitions, with the tier filter filled from the tiers that exist
 * (#058). `columns` without arguments keeps the old import working.
 */
export function partnerColumns(tierCodes: string[] = []): ColumnDef<Partner>[] {
  return buildColumns(tierCodes);
}

export const columns: ColumnDef<Partner>[] = buildColumns([]);
