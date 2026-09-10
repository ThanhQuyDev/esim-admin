'use client';

import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatDateVn, formatVnd } from '@/lib/format';

import {
  myTierEvaluationsQueryOptions,
  mySummaryQueryOptions,
  myTiersQueryOptions
} from '../api/queries';
import type { PartnerTier } from '../api/types';

const num = (v: string | number) => Number(v ?? 0);

/** Rows of the benefits comparison, derived from what a tier actually configures. */
function benefitRows(tiers: PartnerTier[], isKol: boolean) {
  return [
    {
      label: 'Doanh số tối thiểu',
      value: (t: PartnerTier) =>
        num(t.minVolumeVnd) === 0 ? 'Không yêu cầu' : formatVnd(num(t.minVolumeVnd))
    },
    isKol
      ? {
          label: 'Hoa hồng trên đơn hàng',
          value: (t: PartnerTier) => `${num(t.commissionPercent)}%`
        }
      : {
          label: 'Chiết khấu tối đa',
          value: (t: PartnerTier) => `${num(t.maxDiscountPercent)}%`
        }
  ];
}

export function PortalTierView() {
  const { data: summary, isLoading: loadingSummary } = useQuery(mySummaryQueryOptions());
  const { data: tiers, isLoading: loadingTiers } = useQuery(myTiersQueryOptions());
  const { data: evaluations } = useQuery(myTierEvaluationsQueryOptions());

  if (loadingSummary || loadingTiers || !summary) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  const list = tiers ?? [];
  const current = summary.tier.current;
  const isKol = list[0]?.partnerType !== 'distribution';
  const rows = benefitRows(list, isKol);

  return (
    <div className='space-y-6'>
      {/* Current standing */}
      <div className='rounded-lg border p-4'>
        <p className='mb-3 text-sm font-medium'>Tiến độ hạng hiện tại</p>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-2xl font-semibold'>{current ? current.tierName : 'Chưa gán hạng'}</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Doanh số tích lũy {formatVnd(summary.lifetime.revenueVnd)} · {summary.lifetime.orders}{' '}
              đơn hợp lệ
            </p>
          </div>
          <div className='text-right'>
            {summary.tier.next ? (
              <>
                <p className='text-sm'>
                  Hạng kế tiếp: <Badge variant='secondary'>{summary.tier.next.tierName}</Badge>
                </p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Còn {formatVnd(summary.tier.toNextTierVnd)}
                </p>
              </>
            ) : (
              <p className='text-muted-foreground text-sm'>Bạn đang ở hạng cao nhất.</p>
            )}
          </div>
        </div>
        <div className='bg-muted mt-3 h-2 w-full overflow-hidden rounded-full'>
          <div
            className='bg-primary h-full rounded-full transition-all'
            style={{ width: `${summary.tier.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Benefits comparison */}
      <div>
        <p className='mb-3 text-sm font-medium'>So sánh quyền lợi theo hạng</p>
        {list.length === 0 ? (
          <p className='text-muted-foreground rounded-lg border p-6 text-center text-sm'>
            Chương trình chưa công bố hạng đối tác nào.
          </p>
        ) : (
          <div className='overflow-x-auto rounded-lg border'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/50 text-muted-foreground text-xs'>
                <tr>
                  <th className='px-3 py-2 text-left font-medium'>Quyền lợi</th>
                  {list.map((t) => (
                    <th key={t.id} className='px-3 py-2 text-left font-medium'>
                      {t.tierName}
                      {current?.tierCode === t.tierCode && (
                        <Badge className='ml-2' variant='default'>
                          Hạng của bạn
                        </Badge>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className='border-t'>
                    <td className='text-muted-foreground px-3 py-2'>{row.label}</td>
                    {list.map((t) => (
                      <td
                        key={t.id}
                        className={
                          current?.tierCode === t.tierCode ? 'px-3 py-2 font-medium' : 'px-3 py-2'
                        }
                      >
                        {row.value(t)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Weekly review history */}
      <div>
        <p className='mb-3 text-sm font-medium'>Lịch sử xét hạng</p>
        {(evaluations ?? []).length === 0 ? (
          <p className='text-muted-foreground rounded-lg border p-6 text-center text-sm'>
            Chưa có kỳ xét hạng nào. Hệ thống rà soát hạng mỗi tuần một lần.
          </p>
        ) : (
          <div className='overflow-x-auto rounded-lg border'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/50 text-muted-foreground text-xs'>
                <tr>
                  <th className='px-3 py-2 text-left font-medium'>Kỳ đánh giá</th>
                  <th className='px-3 py-2 text-right font-medium'>Đơn hợp lệ</th>
                  <th className='px-3 py-2 text-right font-medium'>Doanh số hợp lệ</th>
                  <th className='px-3 py-2 text-left font-medium'>Hạng trước</th>
                  <th className='px-3 py-2 text-left font-medium'>Hạng sau</th>
                  <th className='px-3 py-2 text-left font-medium'>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {(evaluations ?? []).map((e) => (
                  <tr key={e.id} className='border-t'>
                    <td className='px-3 py-2'>{formatDateVn(e.evaluatedAt)}</td>
                    <td className='px-3 py-2 text-right'>{e.validOrders}</td>
                    <td className='px-3 py-2 text-right'>{formatVnd(num(e.revenueVnd))}</td>
                    <td className='px-3 py-2'>{e.tierBefore ?? '—'}</td>
                    <td className='px-3 py-2'>{e.tierAfter ?? '—'}</td>
                    <td className='px-3 py-2'>
                      <Badge variant={e.result === 'promoted' ? 'default' : 'secondary'}>
                        {e.result === 'promoted' ? 'Lên hạng' : 'Giữ nguyên'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Programme rules */}
      <div className='rounded-lg border p-4'>
        <p className='mb-2 text-sm font-medium'>Quy định xét hạng</p>
        <ul className='text-muted-foreground list-disc space-y-1 pl-5 text-xs'>
          <li>
            <span className='text-foreground font-medium'>Đơn hợp lệ:</span> đơn đã thanh toán thành
            công qua link tiếp thị của bạn và không bị hoàn tiền.
          </li>
          <li>
            <span className='text-foreground font-medium'>Doanh số tính hạng:</span> tổng giá trị
            các đơn hợp lệ, tính lũy kế.
          </li>
          <li>
            <span className='text-foreground font-medium'>Hoa hồng:</span> tính theo % của hạng tại
            thời điểm phát sinh đơn, và được ghi lại trên từng giao dịch.
          </li>
          <li>
            <span className='text-foreground font-medium'>Kỳ đánh giá:</span> hệ thống rà soát hạng
            mỗi tuần một lần. Hạng chỉ được nâng tự động — việc hạ hạng do đội ngũ esim.vn quyết
            định thủ công.
          </li>
          <li>Đơn bị hoàn tiền sẽ bị trừ lại hoa hồng tương ứng.</li>
        </ul>
      </div>
    </div>
  );
}
