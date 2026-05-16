'use client';

import { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { formatNumber, formatVnd } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import { AreaGraph } from './area-graph';
import { BarGraph } from './bar-graph';
import { PieGraph } from './pie-graph';
import { RecentSales } from './recent-sales';
import { OverviewFilters, type OverviewFiltersValue } from './overview-filters';
import { overviewSummaryQueryOptions } from '../api/queries';
import type { OverviewFilters as OverviewFiltersType } from '../api/types';

export function OverviewDashboard() {
  const [filters, setFilters] = useState<OverviewFiltersValue>({
    preset: 'last7days',
    groupBy: 'day',
    provider: undefined
  });

  const queryFilters: OverviewFiltersType = {
    preset: filters.preset,
    groupBy: filters.groupBy,
    provider: filters.provider
  };

  const { data: summary, isLoading, error } = useQuery(overviewSummaryQueryOptions(queryFilters));

  const cards = [
    {
      label: 'Tổng doanh thu',
      value: formatVnd(summary?.totalRevenue),
      footer: 'Doanh thu từ đơn hàng paid/completed',
      icon: Icons.trendingUp
    },
    {
      label: 'Tổng đơn hàng',
      value: formatNumber(summary?.totalOrders),
      footer: 'Số đơn hàng thành công trong kỳ',
      icon: Icons.order
    },
    {
      label: 'Plan đã bán',
      value: formatNumber(summary?.totalPlansSold),
      footer: 'Tổng order items completed',
      icon: Icons.product
    },
    {
      label: 'Người dùng',
      value: formatNumber(summary?.totalUsers),
      footer: `${formatNumber(summary?.activePlans)} active plans · ${formatNumber(
        summary?.failedOrders
      )} failed orders`,
      icon: Icons.teams
    }
  ];

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Tổng quan Overview</h2>
            <p className='text-muted-foreground text-sm'>
              Dữ liệu thống kê từ backend overview API.
            </p>
          </div>
          <Badge variant='outline'>airalo · esimaccess · gadgetkorea</Badge>
        </div>

        <OverviewFilters value={filters} onChange={setFilters} />

        {error ? (
          <Alert variant='destructive'>
            <Icons.alertCircle />
            <AlertTitle>Không thể tải summary</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className='@container/card'>
                <CardHeader>
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    {isLoading ? '...' : card.value}
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <Icon />
                      Live
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>Backend overview API</div>
                  <div className='text-muted-foreground'>{card.footer}</div>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>
            <BarGraph filters={queryFilters} />
          </div>
          <div className='col-span-4 md:col-span-3'>
            <RecentSales filters={queryFilters} />
          </div>
          <div className='col-span-4'>
            <AreaGraph filters={queryFilters} />
          </div>
          <div className='col-span-4 min-h-0 md:col-span-3'>
            <PieGraph filters={queryFilters} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
