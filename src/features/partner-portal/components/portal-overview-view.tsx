'use client';

/**
 * Partner dashboard.
 *
 * Built from the admin console's own vocabulary so the portal reads as the same
 * product: the KPI grid from `features/overview/components/overview-dashboard`,
 * charts through `ChartContainer` with `--chart-*` tokens, and Card/Badge for
 * everything else. No colour is written by hand — the theme owns them all, so
 * the portal follows the active theme and dark mode like every admin screen.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import {
  myOrdersQueryOptions,
  myProfileQueryOptions,
  mySummaryQueryOptions,
  myTicketsQueryOptions
} from '../api/queries';
import type { MyOrder } from '../api/types';

const DAYS = 30;

const performanceConfig = {
  revenue: { label: 'Doanh số', color: 'var(--chart-1)' },
  commission: { label: 'Hoa hồng đã duyệt', color: 'var(--chart-2)' }
} satisfies ChartConfig;

/**
 * Daily revenue and credited commission for the last 30 days.
 *
 * The summary endpoint returns totals only, so the series is bucketed from the
 * partner's own orders — the same rows the orders screen lists.
 */
function buildSeries(orders: MyOrder[]) {
  const today = new Date();
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (DAYS - 1 - i));
    return d;
  });

  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const revenue = new Map<string, number>();
  const commission = new Map<string, number>();

  for (const order of orders) {
    const k = key(new Date(order.createdAt));
    revenue.set(k, (revenue.get(k) ?? 0) + (order.vndPrice ?? 0));
    if (order.commissionStatus === 'credited') {
      commission.set(k, (commission.get(k) ?? 0) + (order.commissionVnd ?? 0));
    }
  }

  return days.map((d) => ({
    label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
    revenue: revenue.get(key(d)) ?? 0,
    commission: commission.get(key(d)) ?? 0
  }));
}

/** Relative age, for the "cần xử lý" list. */
function age(iso: string | undefined): string {
  if (!iso) return '';
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return 'Vừa xong';
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Hôm qua' : `${days} ngày trước`;
}

export function PortalOverviewView() {
  const { data: summary, isLoading } = useQuery(mySummaryQueryOptions());
  const { data: orders } = useQuery(myOrdersQueryOptions());
  const { data: me } = useQuery(myProfileQueryOptions());
  const { data: tickets } = useQuery(myTicketsQueryOptions());

  const chartData = useMemo(() => buildSeries(orders ?? []), [orders]);

  const p30 = summary?.performance30d;
  const conversion = p30 && p30.clicks > 0 ? (p30.orders / p30.clicks) * 100 : 0;
  const tier = summary?.tier;
  const progress = Math.max(0, Math.min(100, Math.round(tier?.progressPercent ?? 0)));
  const growth = summary?.monthOverMonth?.commissionGrowthPercent ?? 0;
  const carriedDebt = summary?.wallet.carriedDebtVnd ?? 0;

  const cards = [
    {
      label: 'Khả dụng để thanh toán',
      value: formatVnd(summary?.wallet.availableBalanceVnd),
      badge: 'Số dư',
      icon: Icons.wallet,
      footerStrong: 'Đã đủ điều kiện rút',
      footer: `${formatVnd(summary?.commissionPendingVnd)} đang chờ đối soát`
    },
    {
      label: 'Lượt nhấp 30 ngày',
      value: (p30?.clicks ?? 0).toLocaleString('vi-VN'),
      badge: '30 ngày',
      icon: Icons.link,
      footerStrong: `Tỷ lệ chuyển đổi ${conversion.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`,
      footer: `${(summary?.lifetime.clicks ?? 0).toLocaleString('vi-VN')} lượt nhấp tích luỹ`
    },
    {
      label: 'Doanh số 30 ngày',
      value: formatVnd(p30?.revenueVnd),
      badge: `${(p30?.orders ?? 0).toLocaleString('vi-VN')} đơn`,
      icon: Icons.order,
      footerStrong:
        p30 && p30.orders > 0
          ? `Trung bình ${formatVnd(Math.round(p30.revenueVnd / p30.orders))}/đơn`
          : 'Chưa có đơn hợp lệ',
      footer: `${formatVnd(summary?.lifetime.revenueVnd)} tích luỹ`
    },
    {
      label: 'Hoa hồng 30 ngày',
      value: formatVnd(p30?.commissionVnd),
      badge: tier?.current ? `Hạng ${tier.current.tierName}` : 'Chưa gán hạng',
      icon: Icons.trendingUp,
      footerStrong: tier?.current
        ? `Tỷ lệ ${Number(tier.current.commissionPercent)}%`
        : 'Chưa áp dụng tỷ lệ',
      footer: `${formatVnd(summary?.lifetime.commissionVnd)} đã ghi nhận`
    }
  ];

  // Everything the partner still has to act on, most blocking first.
  const openTicket = (tickets ?? []).find((t) => t.status !== 'closed' && t.status !== 'resolved');
  const todo = [
    !me?.bankAccountNumber && {
      key: 'bank',
      title: 'Bổ sung tài khoản ngân hàng',
      description: 'Yêu cầu rút tiền chỉ được duyệt khi hồ sơ có tài khoản nhận tiền.',
      href: '/dashboard/portal/profile',
      tone: 'destructive' as const,
      meta: 'Cần xử lý'
    },
    openTicket && {
      key: 'ticket',
      title: `Yêu cầu hỗ trợ #${openTicket.id} đang mở`,
      description: openTicket.subject,
      href: '/dashboard/portal/support',
      tone: 'secondary' as const,
      meta: age(openTicket.updatedAt)
    },
    (summary?.commissionPendingVnd ?? 0) > 0 && {
      key: 'pending',
      title: `${formatVnd(summary?.commissionPendingVnd)} hoa hồng chờ đối soát`,
      description: 'Khoản này chuyển sang số dư khả dụng sau khi đơn qua thời gian kiểm tra.',
      href: '/dashboard/portal/commissions',
      tone: 'outline' as const,
      meta: 'Đang chờ'
    }
  ].filter(Boolean) as {
    key: string;
    title: string;
    description: string;
    href: string;
    tone: 'destructive' | 'secondary' | 'outline';
    meta: string;
  }[];

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      {/*
        Money on the left, tier progress on the right — the two-column band the
        design opens with (#008). The three figures are the ones a partner
        checks first, so they sit on the accent panel rather than in the KPI
        grid below.
      */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <Card className='bg-primary text-primary-foreground border-transparent lg:col-span-2'>
          <CardHeader>
            <CardDescription className='text-primary-foreground/70'>Số dư ví</CardDescription>
            <CardTitle className='text-3xl font-semibold tabular-nums'>
              {isLoading ? '…' : formatVnd(summary?.wallet.balanceVnd)}
            </CardTitle>
            <CardAction>
              <Badge
                variant='outline'
                className='border-primary-foreground/30 text-primary-foreground'
              >
                {growth >= 0 ? <Icons.trendingUp /> : <Icons.trendingDown />}
                {growth > 0 ? '+' : ''}
                {growth}% so với cùng kỳ tháng trước
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className='grid gap-4 sm:grid-cols-2'>
            <div>
              <p className='text-primary-foreground/70 text-sm'>Khả dụng để rút</p>
              <p className='text-2xl font-semibold tabular-nums'>
                {formatVnd(summary?.wallet.availableBalanceVnd)}
              </p>
            </div>
            <div>
              <p className='text-primary-foreground/70 text-sm'>Hoa hồng chờ duyệt</p>
              <p className='text-2xl font-semibold tabular-nums'>
                {formatVnd(summary?.commissionPendingVnd)}
              </p>
            </div>
            {carriedDebt > 0 && (
              <p className='text-primary-foreground/80 text-xs sm:col-span-2'>
                Đang bị trừ {formatVnd(carriedDebt)} do đơn đã nhận hoa hồng bị hoàn tiền hoặc hủy.
              </p>
            )}
          </CardContent>
          <CardFooter className='gap-2'>
            <Button asChild variant='secondary' size='sm'>
              <Link href='/dashboard/portal/payouts'>Rút tiền</Link>
            </Button>
            <Button
              asChild
              size='sm'
              variant='outline'
              className='border-primary-foreground/30 bg-transparent hover:bg-primary-foreground/10 text-primary-foreground hover:text-primary-foreground'
            >
              <Link href='/dashboard/portal/commissions'>Xem hoa hồng</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Tiến trình lên hạng</CardDescription>
            <CardTitle className='text-2xl font-semibold'>
              {tier?.current ? `Hạng ${tier.current.tierName}` : 'Chưa gán hạng'}
            </CardTitle>
            <CardAction>
              <Badge variant='outline'>{progress}%</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
              <div className='bg-primary h-full rounded-full' style={{ width: `${progress}%` }} />
            </div>
            <p className='text-muted-foreground text-sm'>
              {tier?.next
                ? `Còn ${formatVnd(tier.toNextTierVnd)} doanh số để lên hạng ${tier.next.tierName}.`
                : 'Bạn đang ở hạng cao nhất của chương trình.'}
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant='outline' size='sm'>
              <Link href='/dashboard/portal/tier'>Xem hạng đối tác</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className='@container/card'>
              <CardHeader>
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {isLoading ? '…' : card.value}
                </CardTitle>
                <CardAction>
                  <Badge variant='outline'>
                    <Icon />
                    {card.badge}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>{card.footerStrong}</div>
                <div className='text-muted-foreground'>{card.footer}</div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <div className='col-span-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex flex-wrap items-center gap-2'>
                Hiệu suất 30 ngày
                <Badge variant='outline'>Doanh số {formatVnd(p30?.revenueVnd)}</Badge>
              </CardTitle>
              <CardDescription>
                Doanh số và hoa hồng đã duyệt, tổng hợp từ đơn hàng ghi nhận cho bạn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={performanceConfig} className='h-[280px] w-full'>
                <AreaChart accessibilityLayer data={chartData} margin={{ left: 8, right: 8 }}>
                  <defs>
                    <linearGradient id='fillRevenue' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='var(--color-revenue)' stopOpacity={0.8} />
                      <stop offset='95%' stopColor='var(--color-revenue)' stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id='fillCommission' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='var(--color-commission)' stopOpacity={0.8} />
                      <stop offset='95%' stopColor='var(--color-commission)' stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray='3 3' />
                  <XAxis
                    dataKey='label'
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval='preserveStartEnd'
                    minTickGap={24}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={56}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)
                    }
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className='flex min-w-[180px] items-center justify-between gap-3'>
                            <span className='text-muted-foreground'>
                              {performanceConfig[name as keyof typeof performanceConfig]?.label ??
                                name}
                            </span>
                            <span className='font-mono font-medium'>
                              {formatVnd(Number(value))}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    dataKey='revenue'
                    type='monotone'
                    fill='url(#fillRevenue)'
                    stroke='var(--color-revenue)'
                    strokeWidth={2}
                  />
                  <Area
                    dataKey='commission'
                    type='monotone'
                    fill='url(#fillCommission)'
                    stroke='var(--color-commission)'
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className='col-span-4 md:col-span-3'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle className='flex flex-wrap items-center gap-2'>
                Hạng đối tác
                <Badge variant='outline'>
                  {tier?.current ? tier.current.tierName : 'Chưa gán hạng'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {tier?.next
                  ? `Còn ${formatVnd(tier.toNextTierVnd)} doanh số để đạt hạng ${tier.next.tierName}.`
                  : 'Bạn đang ở hạng cao nhất hiện có.'}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>Tiến độ lên hạng</span>
                  <span className='font-medium tabular-nums'>{progress}%</span>
                </div>
                <div className='bg-muted h-2 overflow-hidden rounded-full'>
                  <div
                    className='bg-primary h-full rounded-full transition-[width] duration-500'
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className='grid grid-cols-3 gap-2 border-t pt-4 text-xs'>
                <div>
                  <p className='text-muted-foreground'>Hoa hồng</p>
                  <p className='text-foreground font-medium tabular-nums'>
                    {tier?.current ? `${Number(tier.current.commissionPercent)}%` : '—'}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Giảm tối đa</p>
                  <p className='text-foreground font-medium tabular-nums'>
                    {tier?.current ? `${Number(tier.current.maxDiscountPercent)}%` : '—'}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Đơn 30 ngày</p>
                  <p className='text-foreground font-medium tabular-nums'>
                    {(p30?.orders ?? 0).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className='flex flex-wrap gap-2'>
                <Button asChild size='sm'>
                  <Link href='/dashboard/portal/payouts'>Yêu cầu rút tiền</Link>
                </Button>
                <Button asChild size='sm' variant='outline'>
                  <Link href='/dashboard/portal/tier'>Xem quyền lợi hạng</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Cần bạn xử lý
            {todo.length > 0 ? (
              <Badge variant='secondary'>{todo.length}</Badge>
            ) : (
              <Badge variant='outline'>Không có việc tồn</Badge>
            )}
          </CardTitle>
          <CardDescription>Những việc đang chặn dòng tiền hoặc cần bạn phản hồi.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          {todo.length === 0 && (
            <p className='text-muted-foreground py-6 text-center text-sm'>
              Không có việc nào đang chờ bạn.
            </p>
          )}
          {todo.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className='hover:bg-accent flex items-start justify-between gap-4 rounded-lg border p-3 transition-colors'
            >
              <div className='min-w-0'>
                <p className='text-sm font-medium'>{item.title}</p>
                <p className='text-muted-foreground mt-0.5 text-xs'>{item.description}</p>
              </div>
              <Badge variant={item.tone} className='shrink-0'>
                {item.meta}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
