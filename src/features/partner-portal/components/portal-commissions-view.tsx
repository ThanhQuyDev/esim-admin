'use client';

/**
 * Commissions.
 *
 * KPI strip, the chart beside the lifecycle explainer, then the per-order
 * ledger — the admin console's list-screen shape.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { formatDateVn, formatVnd } from '@/lib/format';

import { myOrdersQueryOptions, mySummaryQueryOptions } from '../api/queries';
import type { MyOrder } from '../api/types';
import { COMMISSION_STATUS } from './orders-table/columns';

const DAYS = 14;

const commissionConfig = {
  raised: { label: 'Phát sinh', color: 'var(--chart-1)' },
  credited: { label: 'Đã duyệt', color: 'var(--chart-2)' }
} satisfies ChartConfig;

/** Commission raised vs credited per day, over the last two weeks. */
function buildSeries(orders: MyOrder[]) {
  const today = new Date();
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (DAYS - 1 - i));
    return d;
  });
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const raised = new Map<string, number>();
  const credited = new Map<string, number>();
  for (const order of orders) {
    if (order.commissionVnd == null) continue;
    const k = key(new Date(order.createdAt));
    raised.set(k, (raised.get(k) ?? 0) + order.commissionVnd);
    if (order.commissionStatus === 'credited') {
      credited.set(k, (credited.get(k) ?? 0) + order.commissionVnd);
    }
  }

  return days.map((d) => ({
    label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
    raised: raised.get(key(d)) ?? 0,
    credited: credited.get(key(d)) ?? 0
  }));
}

const LIFECYCLE = [
  {
    step: 1,
    title: 'Đơn được ghi nhận',
    description: 'Link hoặc mã đối tác của bạn được hệ thống xác định là nguồn hợp lệ.'
  },
  {
    step: 2,
    title: 'Chờ đối soát',
    description: 'Đơn đã thanh toán và đang qua thời gian kiểm tra hoàn tiền.'
  },
  {
    step: 3,
    title: 'Có thể rút',
    description: 'Khoản hoa hồng chuyển sang số dư khả dụng và có thể tạo yêu cầu rút.'
  }
];

export function PortalCommissionsView() {
  const { data: summary, isLoading } = useQuery(mySummaryQueryOptions());
  const { data: orders } = useQuery(myOrdersQueryOptions());

  const chartData = useMemo(() => buildSeries(orders ?? []), [orders]);
  const ledger = useMemo(() => (orders ?? []).filter((o) => o.commissionVnd != null), [orders]);

  const pendingCount = ledger.filter((o) => o.commissionStatus === 'pending').length;
  const rate = summary?.tier.current ? Number(summary.tier.current.commissionPercent) : 0;
  const carriedDebt = summary?.wallet.carriedDebtVnd ?? 0;

  const cards = [
    {
      label: 'Chờ đối soát',
      value: formatVnd(summary?.commissionPendingVnd),
      badge: `${pendingCount} đơn`,
      icon: Icons.clock,
      footerStrong: 'Chưa thể rút',
      footer: 'Chuyển sang khả dụng sau thời gian kiểm tra hoàn tiền'
    },
    {
      label: 'Có thể rút',
      value: formatVnd(summary?.wallet.availableBalanceVnd),
      badge: 'Khả dụng',
      icon: Icons.wallet,
      // A clawed-back commission leaves a debt the next period pays off, so
      // saying only "0đ khả dụng" would hide why (#007).
      footerStrong:
        carriedDebt > 0 ? `Đang bị trừ ${formatVnd(carriedDebt)}` : 'Đã đủ điều kiện thanh toán',
      footer:
        carriedDebt > 0
          ? 'Hoa hồng của đơn bị hoàn tiền/hủy, cấn trừ vào kỳ thanh toán tiếp theo'
          : 'Tạo yêu cầu rút ở màn Rút tiền'
    },
    {
      label: 'Đã ghi nhận lũy kế',
      value: formatVnd(summary?.lifetime.commissionVnd),
      badge: 'Tất cả thời gian',
      icon: Icons.trendingUp,
      footerStrong: `${formatVnd(summary?.performance.commissionVnd)} trong 30 ngày`,
      footer: `Trên ${formatVnd(summary?.lifetime.revenueVnd)} doanh số tích luỹ`
    },
    {
      label: 'Tỷ lệ hoa hồng',
      value: `${rate}%`,
      badge: summary?.tier.current ? summary.tier.current.tierName : 'Chưa gán hạng',
      icon: Icons.award,
      footerStrong: 'Theo hạng hiện tại',
      footer: summary?.tier.next
        ? `Lên hạng ${summary.tier.next.tierName} để tăng tỷ lệ`
        : 'Bạn đang ở hạng cao nhất'
    }
  ];

  return (
    <div className='flex flex-1 flex-col space-y-4'>
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
                Hoa hồng 14 ngày
                <Badge variant='outline'>
                  Đã duyệt {formatVnd(summary?.performance.commissionVnd)}
                </Badge>
              </CardTitle>
              <CardDescription>Khoản phát sinh theo ngày và phần đã qua đối soát.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={commissionConfig} className='h-[280px] w-full'>
                <BarChart accessibilityLayer data={chartData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray='3 3' />
                  <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={8} />
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
                              {commissionConfig[name as keyof typeof commissionConfig]?.label ??
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
                  <Bar dataKey='raised' fill='var(--color-raised)' radius={6} />
                  <Bar dataKey='credited' fill='var(--color-credited)' radius={6} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className='col-span-4 md:col-span-3'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Hoa hồng được xác nhận thế nào</CardTitle>
              <CardDescription>
                Ba bước một khoản hoa hồng đi qua trước khi bạn rút được.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {LIFECYCLE.map((item) => (
                <div key={item.step} className='flex gap-3 rounded-lg border p-3'>
                  <div className='bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums'>
                    {item.step}
                  </div>
                  <div className='min-w-0'>
                    <p className='text-sm font-medium'>{item.title}</p>
                    <p className='text-muted-foreground mt-0.5 text-xs'>{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Giao dịch hoa hồng
            <Badge variant='outline'>{ledger.length} dòng</Badge>
          </CardTitle>
          <CardDescription>Chi tiết theo từng đơn hàng hợp lệ.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className='text-right'>Doanh thu</TableHead>
                  <TableHead className='text-right'>Tỷ lệ</TableHead>
                  <TableHead className='text-right'>Hoa hồng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className='h-24 text-center'>
                      <p className='text-muted-foreground text-sm'>
                        Chưa có giao dịch hoa hồng nào.
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Hoa hồng xuất hiện ở đây sau khi có đơn ghi nhận qua link hoặc mã của bạn.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
                {ledger.map((o) => {
                  const status = COMMISSION_STATUS[o.commissionStatus ?? ''];
                  const effectiveRate =
                    o.vndPrice > 0 ? ((o.commissionVnd ?? 0) / o.vndPrice) * 100 : 0;
                  return (
                    <TableRow key={o.orderNumber}>
                      <TableCell className='whitespace-nowrap'>
                        {formatDateVn(o.createdAt)}
                      </TableCell>
                      <TableCell className='font-mono text-xs'>#{o.orderNumber}</TableCell>
                      <TableCell>{o.items.map((i) => i.planName).join(' + ') || '—'}</TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {formatVnd(o.vndPrice)}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {effectiveRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%
                      </TableCell>
                      <TableCell className='text-right font-medium tabular-nums'>
                        {formatVnd(o.commissionVnd ?? 0)}
                      </TableCell>
                      <TableCell>
                        {status ? (
                          <Badge variant='outline' className={status.className}>
                            {status.label}
                          </Badge>
                        ) : (
                          <Badge variant='outline'>{o.status}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
