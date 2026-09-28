'use client';

/**
 * Dashboard for a distribution partner (#043).
 *
 * The marketing dashboard answers "what did I earn?" — clicks, conversion,
 * commission, tier progress. None of that is a distribution partner's business:
 * they buy the eSIMs and resell them, so what they need is their own buying.
 * How many orders, how many fell over, what they spent, split between eSIMs and
 * top-ups — and how many of the eSIMs they bought have actually been switched
 * on, because one that has not is stock they are still holding.
 *
 * Same vocabulary as the rest of the console: the KPI grid, Card/Badge, and no
 * colour written by hand.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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
  myDistributionSeriesQueryOptions,
  myDistributionSummaryQueryOptions,
  myProfileQueryOptions,
  myTopDestinationsQueryOptions
} from '../api/queries';
import {
  DEFAULT_PORTAL_PERIOD,
  PortalPeriodFilter,
  periodLabel,
  resolvePeriod,
  type PortalPeriod
} from './portal-period-filter';

const count = (value: number | undefined) => (value ?? 0).toLocaleString('vi-VN');

const activityConfig = {
  orders: { label: 'Đơn đã mua', color: 'var(--chart-1)' },
  activatedEsims: { label: 'eSIM đã kích hoạt', color: 'var(--chart-2)' }
} satisfies ChartConfig;

const destinationConfig = {
  plansPurchased: { label: 'eSIM', color: 'var(--chart-1)' }
} satisfies ChartConfig;

/**
 * A bucket start as the axis should read it (#045).
 *
 * The granularity decides how much of the date is worth showing: a day needs
 * the day, a year does not.
 */
function bucketLabel(bucket: string, groupBy: string): string {
  const d = new Date(bucket);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  if (groupBy === 'year') return String(d.getFullYear());
  if (groupBy === 'month') return `${mm}/${d.getFullYear()}`;
  if (groupBy === 'week') return `Tuần ${dd}/${mm}`;
  return `${dd}/${mm}`;
}

export function PortalDistributionOverviewView() {
  // The same filter the marketing dashboard and the admin overview use (#044):
  // quick presets, a granularity and the calendar picker.
  const [period, setPeriod] = useState<PortalPeriod>(DEFAULT_PORTAL_PERIOD);
  const range = useMemo(() => resolvePeriod(period), [period]);
  const rangeLabel = periodLabel(period);

  const { data: summary, isLoading } = useQuery(myDistributionSummaryQueryOptions(range));
  const { data: me } = useQuery(myProfileQueryOptions());
  const { data: series = [] } = useQuery(
    myDistributionSeriesQueryOptions({ ...range, groupBy: period.groupBy })
  );
  const { data: destinations = [] } = useQuery(myTopDestinationsQueryOptions(range));

  const chartData = useMemo(
    () =>
      series.map((point) => ({
        label: bucketLabel(point.bucket, period.groupBy),
        orders: point.orders,
        activatedEsims: point.activatedEsims
      })),
    [series, period.groupBy]
  );

  const total = summary?.total;
  const esim = summary?.esim;
  const topup = summary?.topup;
  const activated = summary?.activatedEsims;

  // An eSIM bought but never switched on is stock, so the share that has been
  // is the one number that says how the reselling is actually going.
  const activationRate =
    esim && esim.orders > 0 && activated
      ? Math.min(100, Math.round((activated.count / Math.max(1, esim.orders)) * 100))
      : 0;
  const avgOrderVnd = total && total.orders > 0 ? Math.round(total.revenueVnd / total.orders) : 0;

  const cards = [
    {
      label: `Tổng đơn hàng · ${rangeLabel}`,
      value: count(total?.orders),
      badge: `${count(total?.cancelledOrders)} huỷ`,
      icon: Icons.order,
      footerStrong: `Đã chi ${formatVnd(total?.revenueVnd)}`,
      footer:
        total && total.orders > 0
          ? `Trung bình ${formatVnd(avgOrderVnd)} mỗi đơn`
          : 'Chưa có đơn nào trong kỳ'
    },
    {
      label: 'Đơn eSIM',
      value: count(esim?.orders),
      badge: `${count(esim?.cancelledOrders)} huỷ`,
      icon: Icons.simCard,
      footerStrong: formatVnd(esim?.revenueVnd),
      footer: 'Tiền đã chi cho các đơn eSIM đã thanh toán'
    },
    {
      label: 'Đơn nạp thêm dung lượng',
      value: count(topup?.orders),
      badge: `${count(topup?.cancelledOrders)} huỷ`,
      icon: Icons.add,
      footerStrong: formatVnd(topup?.revenueVnd),
      footer: 'Tiền đã chi cho các đơn topup đã thanh toán'
    },
    {
      label: 'eSIM đã kích hoạt',
      value: count(activated?.count),
      badge: `${activationRate}%`,
      icon: Icons.check,
      footerStrong: `Giá trị ${formatVnd(activated?.revenueVnd)}`,
      footer: 'eSIM khách đã kích hoạt trong kỳ — phần còn lại vẫn là hàng tồn'
    },
    {
      label: 'Đơn huỷ',
      value: count(total?.cancelledOrders),
      badge:
        total && total.orders > 0
          ? `${Math.round((total.cancelledOrders / total.orders) * 100)}%`
          : '0%',
      icon: Icons.warning,
      footerStrong: 'Gồm đơn huỷ, thất bại và đã hoàn tiền',
      footer: 'Đơn huỷ không tính vào doanh số đã chi ở trên'
    }
  ];

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <PortalPeriodFilter value={period} onChange={setPeriod} />

      <Card className='from-primary/5 to-card dark:bg-card bg-gradient-to-t shadow-xs'>
        <CardHeader>
          <CardDescription>
            Tổng tiền đã chi · {rangeLabel}
            {me?.contactName ? ` · ${me.contactName}` : ''}
          </CardDescription>
          <CardTitle className='text-3xl font-semibold tabular-nums'>
            {isLoading ? '…' : formatVnd(total?.revenueVnd)}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <Icons.wallet />
              {count(total?.orders)} đơn
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>
            Gồm {count(esim?.orders)} đơn eSIM ({formatVnd(esim?.revenueVnd)}) và{' '}
            {count(topup?.orders)} đơn nạp thêm dung lượng ({formatVnd(topup?.revenueVnd)}).
          </p>
        </CardContent>
        <CardFooter className='flex flex-wrap gap-2'>
          <Button asChild size='sm'>
            <Link href='/dashboard/portal/wallet'>Thanh toán</Link>
          </Button>
          <Button asChild size='sm' variant='outline'>
            <Link href='/dashboard/portal/orders'>Xem đơn hàng</Link>
          </Button>
        </CardFooter>
      </Card>

      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
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
                Đơn đã mua & eSIM đã kích hoạt
                <Badge variant='outline'>{rangeLabel}</Badge>
              </CardTitle>
              <CardDescription>
                Đơn tính theo ngày đặt, eSIM tính theo ngày khách kích hoạt — nên hai cột của cùng
                một kỳ thường lệch nhau.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className='text-muted-foreground py-16 text-center text-sm'>
                  Chưa có đơn nào trong kỳ này.
                </p>
              ) : (
                <ChartContainer config={activityConfig} className='h-[280px] w-full'>
                  <BarChart accessibilityLayer data={chartData} margin={{ left: 8, right: 8 }}>
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
                      width={40}
                      allowDecimals={false}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey='orders' fill='var(--color-orders)' radius={4} />
                    <Bar dataKey='activatedEsims' fill='var(--color-activatedEsims)' radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='col-span-4 md:col-span-3'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle className='flex flex-wrap items-center gap-2'>
                Điểm đến mua nhiều
                <Badge variant='outline'>{rangeLabel}</Badge>
              </CardTitle>
              <CardDescription>
                Xếp theo số eSIM bạn đã mua — biết hàng nào chạy để nhập tiếp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {destinations.length === 0 ? (
                <p className='text-muted-foreground py-16 text-center text-sm'>
                  Chưa có đơn nào trong kỳ này.
                </p>
              ) : (
                <ChartContainer config={destinationConfig} className='h-[280px] w-full'>
                  <BarChart
                    accessibilityLayer
                    layout='vertical'
                    data={destinations}
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray='3 3' />
                    <XAxis
                      type='number'
                      dataKey='plansPurchased'
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type='category'
                      dataKey='name'
                      tickLine={false}
                      axisLine={false}
                      width={110}
                      tickMargin={8}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(
                            value: unknown,
                            _name: unknown,
                            item: { payload?: { revenueVnd?: number } }
                          ) => (
                            <div className='flex min-w-[180px] flex-col gap-0.5'>
                              <span className='font-medium'>{Number(value)} eSIM</span>
                              <span className='text-muted-foreground'>
                                {formatVnd(Number(item?.payload?.revenueVnd ?? 0))} đã chi
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar dataKey='plansPurchased' fill='var(--color-plansPurchased)' radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
