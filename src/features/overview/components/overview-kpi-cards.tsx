'use client';

/**
 * The five KPI cards of Tổng quan (vande #059). Each has one headline figure
 * and the figures that explain it; three of them open the page behind them.
 * "Web" = what customers buy on the site (directly, via a marketing partner,
 * or ordered for them by an admin), never a distribution / API partner's
 * wholesale purchase.
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { formatNumber, formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';
import { overviewKpisQueryOptions } from '../api/queries';
import type { OverviewFilters } from '../api/types';

type KpiCard = {
  key: string;
  label: string;
  value: string;
  note: string;
  rows: [string, string][];
  href?: string;
};

export function OverviewKpiCards({ filters }: { filters: OverviewFilters }) {
  const { data: k, isLoading, error } = useQuery(overviewKpisQueryOptions(filters));

  if (error) {
    return <p className='text-destructive text-sm'>Không tải được số liệu: {error.message}</p>;
  }

  const cards: KpiCard[] = k
    ? [
        {
          key: 'revenue',
          label: 'Doanh thu thuần',
          value: formatVnd(k.revenue.netRevenueVnd),
          note: 'Tiền thu − hoàn tiền − giảm giá, đơn eSIM trên web (gồm đơn tiếp thị)',
          rows: [
            ['Giá vốn', formatVnd(k.revenue.costVnd)],
            ['Hoa hồng đối tác', formatVnd(k.revenue.partnerCommissionVnd)],
            ['Lợi nhuận gộp', formatVnd(k.revenue.grossProfitVnd)]
          ]
        },
        {
          key: 'orders',
          label: 'Tổng đơn hàng',
          value: formatNumber(k.orders.paidOrders),
          note: 'Đơn thành công: khách web, tiếp thị, admin tạo (eSIM & topup)',
          rows: [
            ['eSIM đã bán', formatNumber(k.orders.esimsSold)],
            [
              'Tỷ lệ chuyển đổi',
              k.orders.conversionPercent == null
                ? 'Chưa có lượt truy cập'
                : `${k.orders.conversionPercent}% (${formatNumber(k.orders.visits)} lượt)`
            ]
          ],
          href: '/dashboard/orders'
        },
        {
          key: 'partners',
          label: 'Đối tác hoạt động',
          value: formatNumber(k.partners.active),
          note: 'Hiện tại, không theo khoảng thời gian',
          rows: [
            ['Tiếp thị', formatNumber(k.partners.kol)],
            ['Phân phối', formatNumber(k.partners.distribution)],
            ['Chờ duyệt', formatNumber(k.partners.pending)]
          ],
          href: '/dashboard/partners/approvals'
        },
        {
          key: 'payouts',
          label: 'Chờ rút',
          value: formatVnd(k.payouts.pendingVnd),
          note: `${formatNumber(k.payouts.pendingPartners)} đối tác đang yêu cầu rút`,
          rows: [
            ['Hoa hồng chờ xác nhận', formatVnd(k.payouts.commissionPendingVnd)],
            ['Hoa hồng khả dụng rút', formatVnd(k.payouts.commissionAvailableVnd)],
            ['Ký quỹ khả dụng rút', formatVnd(k.payouts.depositAvailableVnd)]
          ],
          href: '/dashboard/partners/payouts'
        },
        {
          key: 'customers',
          label: 'Người dùng mới',
          value: formatNumber(k.customers.newUsers),
          note: 'Khách hàng tạo tài khoản trong kỳ',
          rows: [
            ['Gói cước bán ra', formatNumber(k.customers.plansSold)],
            ['Đơn hàng lỗi', formatNumber(k.customers.failedOrders)]
          ]
        }
      ]
    : [];

  return (
    <div
      className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5'
      data-testid='overview-kpis'
    >
      {isLoading &&
        Array.from({ length: 5 }, (_, i) => (
          <div key={i} className='bg-muted h-48 animate-pulse rounded-xl' />
        ))}
      {cards.map((card) => {
        const body = (
          <Card
            className={cn(
              'from-primary/5 to-card dark:bg-card h-full gap-4 bg-gradient-to-t shadow-xs',
              card.href && 'hover:border-primary/40 transition-colors'
            )}
            data-testid={`kpi-${card.key}`}
          >
            <CardHeader>
              <CardDescription className='flex items-center justify-between gap-2'>
                {card.label}
                {card.href && <Icons.arrowRight className='size-4' aria-hidden='true' />}
              </CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums'>{card.value}</CardTitle>
              <p className='text-muted-foreground text-xs'>{card.note}</p>
            </CardHeader>
            <CardContent>
              <dl className='space-y-1.5 border-t pt-3 text-sm'>
                {card.rows.map(([label, value]) => (
                  <div key={label} className='flex justify-between gap-3'>
                    <dt className='text-muted-foreground'>{label}</dt>
                    <dd className='text-right font-medium tabular-nums'>{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        );
        return card.href ? (
          <Link key={card.key} href={card.href} className='block'>
            {body}
          </Link>
        ) : (
          <div key={card.key}>{body}</div>
        );
      })}
    </div>
  );
}
