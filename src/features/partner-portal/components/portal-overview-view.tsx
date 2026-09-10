'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatDateVn, formatVnd } from '@/lib/format';

import { mySummaryQueryOptions, myOrdersQueryOptions } from '../api/queries';

/** One headline number of the last 30 days. */
function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className='rounded-lg border p-4'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='mt-1 text-2xl font-semibold'>{value}</p>
      {hint && <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>}
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    href: '/dashboard/portal/links',
    label: 'Tạo liên kết tiếp thị',
    description: 'Sinh link theo dõi cho một chiến dịch mới.'
  },
  {
    href: '/dashboard/portal/commissions',
    label: 'Xem hoa hồng',
    description: 'Chi tiết hoa hồng theo từng đơn hàng.'
  },
  {
    href: '/dashboard/portal/payouts',
    label: 'Yêu cầu rút tiền',
    description: 'Rút số dư khả dụng về tài khoản ngân hàng.'
  }
];

export function PortalOverviewView() {
  const { data: summary, isLoading } = useQuery(mySummaryQueryOptions());
  const { data: orders } = useQuery(myOrdersQueryOptions());

  if (isLoading || !summary) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  const { performance30d: p30, lifetime, tier, wallet } = summary;
  const recentOrders = (orders ?? []).slice(0, 5);
  // A click that never became an order still cost the partner reach, so the
  // conversion rate is the number they actually steer on.
  const conversionRate = p30.clicks > 0 ? Math.round((p30.orders / p30.clicks) * 1000) / 10 : 0;

  return (
    <div className='space-y-6'>
      {/* Tier progress */}
      <div className='rounded-lg border p-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div>
            <p className='text-sm font-medium'>
              Hạng hiện tại:{' '}
              {tier.current ? (
                <Badge>{tier.current.tierName}</Badge>
              ) : (
                <span className='text-muted-foreground'>Chưa gán hạng</span>
              )}
            </p>
            <p className='text-muted-foreground mt-1 text-xs'>
              {tier.next
                ? `Còn ${formatVnd(tier.toNextTierVnd)} doanh số để lên hạng ${tier.next.tierName}.`
                : 'Bạn đang ở hạng cao nhất.'}
            </p>
          </div>
          <Link
            href='/dashboard/portal/tier'
            className='text-sm font-medium underline underline-offset-4'
          >
            Xem quyền lợi theo hạng
          </Link>
        </div>
        <div className='bg-muted mt-3 h-2 w-full overflow-hidden rounded-full'>
          <div
            className='bg-primary h-full rounded-full transition-all'
            style={{ width: `${tier.progressPercent}%` }}
          />
        </div>
      </div>

      {/* 30-day performance */}
      <div>
        <p className='mb-3 text-sm font-medium'>Hiệu suất 30 ngày</p>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <Stat
            label='Lượt click'
            value={p30.clicks.toLocaleString('vi-VN')}
            hint={`Tổng cộng ${lifetime.clicks.toLocaleString('vi-VN')}`}
          />
          <Stat
            label='Đơn hàng'
            value={p30.orders.toLocaleString('vi-VN')}
            hint={`Tỷ lệ chuyển đổi ${conversionRate}%`}
          />
          <Stat
            label='Doanh số'
            value={formatVnd(p30.revenueVnd)}
            hint={`Tổng cộng ${formatVnd(lifetime.revenueVnd)}`}
          />
          <Stat
            label='Hoa hồng'
            value={formatVnd(p30.commissionVnd)}
            hint={`Tổng cộng ${formatVnd(lifetime.commissionVnd)}`}
          />
        </div>
      </div>

      {/* Wallet + anything still pending */}
      <div className='grid gap-3 sm:grid-cols-3'>
        <Stat label='Số dư ví' value={formatVnd(wallet.balanceVnd)} />
        <Stat label='Khả dụng để rút' value={formatVnd(wallet.availableBalanceVnd)} />
        <Stat
          label='Hoa hồng chờ duyệt'
          value={formatVnd(summary.commissionPendingVnd)}
          hint='Sẽ vào ví khi đơn được thanh toán'
        />
      </div>

      {/* Quick actions */}
      <div>
        <p className='mb-3 text-sm font-medium'>Thao tác thường dùng</p>
        <div className='grid gap-3 sm:grid-cols-3'>
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className='hover:bg-accent rounded-lg border p-4 transition-colors'
            >
              <p className='text-sm font-medium'>{a.label}</p>
              <p className='text-muted-foreground mt-1 text-xs'>{a.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Latest attributed orders */}
      <div>
        <div className='mb-3 flex items-center justify-between'>
          <p className='text-sm font-medium'>Đơn hàng gần đây</p>
          <Link
            href='/dashboard/portal/orders'
            className='text-sm font-medium underline underline-offset-4'
          >
            Xem tất cả
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className='text-muted-foreground rounded-lg border p-6 text-center text-sm'>
            Chưa có đơn hàng nào qua link của bạn.
          </p>
        ) : (
          <div className='space-y-2'>
            {recentOrders.map((o) => (
              <div
                key={o.orderNumber}
                className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{o.orderNumber}</p>
                  <p className='text-muted-foreground text-xs'>
                    {formatDateVn(o.createdAt)}
                    {o.linkCode ? ` · qua ${o.linkCode}` : ''}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-semibold'>{formatVnd(o.vndPrice)}</p>
                  {o.commissionVnd != null && (
                    <p className='text-xs text-green-600'>+{formatVnd(o.commissionVnd)} hoa hồng</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
