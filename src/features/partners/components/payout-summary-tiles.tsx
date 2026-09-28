'use client';

/**
 * The four figures at the head of "Tài chính" (#067).
 *
 * Two kinds of money point opposite ways here: what is owed out to marketing
 * partners, and what distribution partners have paid in and not yet spent.
 * Both are the finance team's exposure on the partner channel, so both sit in
 * the same header rather than on two screens.
 */

import { useQuery } from '@tanstack/react-query';

import { payoutSummaryQueryOptions } from '../api/queries';
import { formatVnd } from '@/lib/format';

function Tile({
  label,
  amountVnd,
  partners,
  partnersLabel,
  hint
}: {
  label: string;
  amountVnd: number;
  partners?: number;
  partnersLabel?: string;
  hint: string;
}) {
  return (
    <div className='rounded-lg border p-4'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='mt-1 text-xl font-semibold tabular-nums'>{formatVnd(amountVnd)}</p>
      {partners !== undefined && (
        <p className='text-muted-foreground mt-1 text-xs'>
          {partners} {partnersLabel ?? 'đối tác'}
        </p>
      )}
      <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>
    </div>
  );
}

export function PayoutSummaryTiles() {
  const { data } = useQuery(payoutSummaryQueryOptions());
  if (!data) return null;

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      <Tile
        label='Đang yêu cầu thanh toán'
        amountVnd={data.payoutRequested.totalVnd}
        partners={data.payoutRequested.partners}
        hint='Đối tác đã bấm yêu cầu rút tiền, chờ duyệt chi'
      />
      <Tile
        label='Đã chi trả tháng này'
        amountVnd={data.paidThisMonth.totalVnd}
        partners={data.paidThisMonth.partners}
        hint='Tính từ đầu tháng'
      />
      <Tile
        label='Đã chi trả lũy kế'
        amountVnd={data.paidAllTime.totalVnd}
        partners={data.paidAllTime.partners}
        hint='Toàn bộ các lần chi trả từ trước đến nay'
      />
      <Tile
        label='Ký quỹ phân phối'
        amountVnd={data.distributionDeposit.totalVnd}
        partners={data.distributionDeposit.partners}
        partnersLabel='đối tác phân phối / API'
        hint='Số dư đối tác đã nạp và chưa dùng đến'
      />
    </div>
  );
}
