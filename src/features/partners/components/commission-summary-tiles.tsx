'use client';

/**
 * The five figures at the head of "Hoa hồng & Đối soát" (#063).
 *
 * They sit above the tabs rather than inside one, because they describe the
 * whole page: the same money whether you are reading it per period or per
 * order.
 */

import { useQuery } from '@tanstack/react-query';

import { commissionSummaryQueryOptions } from '../api/queries';
import { formatVnd } from '@/lib/format';

/**
 * One stage of the commission money, with the partners behind it.
 *
 * The count is what makes the total actionable: 40 triệu owed to two partners
 * is a different afternoon from 40 triệu owed to two hundred.
 */
function StageTile({
  label,
  amountVnd,
  partners,
  hint,
  tone
}: {
  label: string;
  amountVnd: number;
  partners?: number;
  hint: string;
  tone?: 'default' | 'warning' | 'danger';
}) {
  return (
    <div className='rounded-lg border p-4'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p
        className={
          tone === 'danger'
            ? 'text-destructive mt-1 text-xl font-semibold tabular-nums'
            : 'mt-1 text-xl font-semibold tabular-nums'
        }
      >
        {formatVnd(amountVnd)}
      </p>
      {partners !== undefined && (
        <p className='text-muted-foreground mt-1 text-xs'>{partners} đối tác</p>
      )}
      <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>
    </div>
  );
}

export function CommissionSummaryTiles() {
  const { data: summary } = useQuery(commissionSummaryQueryOptions());
  if (!summary) return null;

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5'>
      <StageTile
        label='Chờ xác nhận'
        amountVnd={summary.pendingConfirmation.totalVnd}
        partners={summary.pendingConfirmation.partners}
        hint='Đơn còn trong 24 giờ đầu sau khi đặt'
      />
      <StageTile
        label='Đã duyệt · chờ chi'
        amountVnd={summary.approvedAwaitingPayout.totalVnd}
        partners={summary.approvedAwaitingPayout.partners}
        hint='Đã vào ví đối tác, chưa rút'
      />
      <StageTile
        label='Đang yêu cầu thanh toán'
        amountVnd={summary.payoutRequested.totalVnd}
        partners={summary.payoutRequested.partners}
        hint='Đối tác đã bấm yêu cầu rút tiền'
      />
      <StageTile
        label='Đã chi trả tháng này'
        amountVnd={summary.paidThisMonth.totalVnd}
        partners={summary.paidThisMonth.partners}
        hint='Tính từ đầu tháng'
      />
      <StageTile
        label='Điều chỉnh / hoàn tiền'
        amountVnd={summary.reversed.totalVnd}
        partners={summary.reversed.partners}
        hint='Khách hoàn tiền, huỷ đơn hoặc vi phạm'
        tone='danger'
      />
    </div>
  );
}
