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

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

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
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import { myDistributionSummaryQueryOptions, myProfileQueryOptions } from '../api/queries';

const count = (value: number | undefined) => (value ?? 0).toLocaleString('vi-VN');

export function PortalDistributionOverviewView() {
  const { data: summary, isLoading } = useQuery(myDistributionSummaryQueryOptions());
  const { data: me } = useQuery(myProfileQueryOptions());

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
      label: 'Tổng đơn hàng · 30 ngày',
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
      <Card className='from-primary/5 to-card dark:bg-card bg-gradient-to-t shadow-xs'>
        <CardHeader>
          <CardDescription>
            Tổng tiền đã chi · 30 ngày
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
    </div>
  );
}
