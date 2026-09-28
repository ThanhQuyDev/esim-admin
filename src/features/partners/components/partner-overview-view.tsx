'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import { partnerOverviewQueryOptions, partnerRevenueByTypeQueryOptions } from '../api/queries';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className='rounded-lg border p-4'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='mt-1 text-2xl font-semibold'>{value}</p>
      {hint && <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>}
    </div>
  );
}

/** A queue item worth an admin's attention, linking straight to where it's cleared. */
function QueueRow({
  label,
  count,
  amount,
  href
}: {
  label: string;
  count: number;
  amount?: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className='hover:bg-accent flex items-center justify-between rounded-lg border p-3 transition-colors'
    >
      <div>
        <p className='text-sm font-medium'>{label}</p>
        {amount !== undefined && (
          <p className='text-muted-foreground mt-1 text-xs'>{formatVnd(amount)}</p>
        )}
      </div>
      <Badge variant={count > 0 ? 'default' : 'secondary'}>{count}</Badge>
    </Link>
  );
}

const PARTNER_TYPE_LABEL: Record<string, string> = {
  kol: 'KOL',
  distribution: 'Phân phối',
  api: 'API'
};

/**
 * Growth against the same span immediately before (#050).
 *
 * Shown beside the figure rather than as a number on its own: "12,4 triệu" says
 * nothing until you know whether last month was 6 or 30.
 */
function GrowthBadge({ percent }: { percent: number }) {
  if (percent === 0) return <Badge variant='secondary'>Không đổi</Badge>;
  const up = percent > 0;
  return (
    <Badge
      variant='outline'
      className={
        up
          ? 'border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-400'
          : 'border-red-200 text-red-700 dark:border-red-900 dark:text-red-400'
      }
    >
      {up ? '+' : ''}
      {percent}% so với kỳ trước
    </Badge>
  );
}

export function PartnerOverviewView() {
  const { data, isLoading } = useQuery(partnerOverviewQueryOptions());
  const { data: revenue } = useQuery(partnerRevenueByTypeQueryOptions());

  if (isLoading || !data) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  const { partners, queue, money, topPartners } = data;

  return (
    <div className='space-y-6'>
      {/* What needs a human today */}
      <div>
        <p className='mb-3 text-sm font-medium'>Luồng công việc hôm nay</p>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <QueueRow
            label='Hồ sơ chờ duyệt'
            count={queue.pendingApprovals}
            href='/dashboard/partners/approvals'
          />
          <QueueRow
            label='Yêu cầu rút tiền'
            count={queue.pendingPayouts}
            amount={queue.pendingPayoutVnd}
            href='/dashboard/partners/payouts'
          />
          <QueueRow
            label='Ký quỹ chờ xác nhận'
            count={queue.pendingDeposits}
            href='/dashboard/partners/deposit-requests'
          />
          <QueueRow
            label='Hoa hồng chờ ghi nhận'
            count={queue.pendingCommissions}
            amount={queue.pendingCommissionVnd}
            href='/dashboard/partners/commissions'
          />
        </div>
      </div>

      {/* Programme size */}
      <div>
        <p className='mb-3 text-sm font-medium'>Quy mô chương trình</p>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <Stat
            label='Đối tác đang hoạt động'
            value={String(partners.active)}
            hint={`Tổng ${partners.total} hồ sơ`}
          />
          <Stat label='KOL / Phân phối' value={`${partners.kol} / ${partners.distribution}`} />
          <Stat label='Tạm giữ / Đã khóa' value={`${partners.hold} / ${partners.disabled}`} />
          <Stat label='Chờ duyệt' value={String(partners.pendingApprovals)} />
        </div>
      </div>

      {/*
        What esim.vn actually keeps, by kind of partner (#050). Deliberately
        above the gross figures below: the money that stays is the one an admin
        is answerable for, and reading the two the wrong way round is how a
        programme looks twice as profitable as it is.
      */}
      {revenue && (
        <div>
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <p className='text-sm font-medium'>Doanh thu esim.vn thu về · 30 ngày</p>
            <Badge variant='outline'>{formatVnd(revenue.totalRevenueVnd)}</Badge>
            <GrowthBadge percent={revenue.growthPercent} />
          </div>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {revenue.byType.map((row) => (
              <div key={row.partnerType} className='rounded-lg border p-4'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-sm font-medium'>
                    {PARTNER_TYPE_LABEL[row.partnerType] ?? row.partnerType}
                  </p>
                  <Badge variant='secondary'>{row.partners} đối tác</Badge>
                </div>
                <p className='mt-1 text-2xl font-semibold tabular-nums'>
                  {formatVnd(row.revenueVnd)}
                </p>
                <div className='mt-2'>
                  <GrowthBadge percent={row.growthPercent} />
                </div>
                <div className='text-muted-foreground mt-3 space-y-1 text-xs'>
                  {row.attributedGrossVnd > 0 && (
                    <div className='flex justify-between gap-2'>
                      <span>Đơn ghi nhận</span>
                      <span className='tabular-nums'>{formatVnd(row.attributedGrossVnd)}</span>
                    </div>
                  )}
                  {row.commissionVnd > 0 && (
                    <div className='flex justify-between gap-2'>
                      <span>Trừ hoa hồng</span>
                      <span className='tabular-nums'>−{formatVnd(row.commissionVnd)}</span>
                    </div>
                  )}
                  {row.purchasesVnd > 0 && (
                    <div className='flex justify-between gap-2'>
                      <span>Đối tác mua vào</span>
                      <span className='tabular-nums'>{formatVnd(row.purchasesVnd)}</span>
                    </div>
                  )}
                  {row.revenueVnd === 0 && <p>Chưa phát sinh trong kỳ.</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Money moved through partners */}
      <div>
        <p className='mb-3 text-sm font-medium'>Doanh số & hoa hồng 30 ngày</p>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <Stat label='Doanh số quy về đối tác' value={formatVnd(money.revenue30dVnd)} />
          <Stat label='Số đơn' value={String(money.orders30d)} />
          <Stat label='Hoa hồng 30 ngày' value={formatVnd(money.commission30dVnd)} />
          <Stat
            label='Hoa hồng lũy kế'
            value={formatVnd(money.commissionTotalVnd)}
            hint='Không tính khoản đã hoàn'
          />
        </div>
      </div>

      {/* Who is driving it */}
      <div>
        <p className='mb-3 text-sm font-medium'>Đối tác dẫn đầu 30 ngày</p>
        {topPartners.length === 0 ? (
          <p className='text-muted-foreground rounded-lg border p-6 text-center text-sm'>
            Chưa có đơn hàng nào quy về đối tác trong 30 ngày qua.
          </p>
        ) : (
          <div className='space-y-2'>
            {topPartners.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/partners/${t.id}`}
                className='hover:bg-accent flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 transition-colors'
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{t.contactName}</p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {PARTNER_TYPE_LABEL[t.partnerType] ?? t.partnerType}
                    {t.tierCode ? ` · Hạng ${t.tierCode}` : ''} · {t.orders30d} đơn
                  </p>
                </div>
                <p className='text-sm font-semibold'>{formatVnd(t.revenue30dVnd)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
