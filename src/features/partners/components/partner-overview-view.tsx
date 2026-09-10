'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import { partnerOverviewQueryOptions } from '../api/queries';

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
  distribution: 'Phân phối'
};

export function PartnerOverviewView() {
  const { data, isLoading } = useQuery(partnerOverviewQueryOptions());

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
