'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { formatVnd } from '@/lib/format';
import { financialComparisonQueryOptions } from '../api/queries';
import type { FinancialComparisonSeriesResponse } from '../api/types';

const financialComparisonConfig = {
  costPrice: {
    label: 'Cost price',
    color: 'var(--chart-1)'
  },
  totalRevenue: {
    label: 'Tổng doanh thu',
    color: 'var(--chart-2)'
  },
  profit: {
    label: 'Lợi nhuận',
    color: 'var(--chart-3)'
  }
} satisfies ChartConfig;

function isFinancialSeries(data: unknown): data is FinancialComparisonSeriesResponse {
  return typeof data === 'object' && data !== null && 'series' in data;
}

function formatDateLabel(value: string) {
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(
      new Date(value)
    );
  }
  return value;
}

export function AreaGraph() {
  const { data, isLoading, error } = useQuery(financialComparisonQueryOptions({ groupBy: 'day' }));

  const chartData = useMemo(() => {
    if (!isFinancialSeries(data)) return [];
    return data.series.map((item) => ({ ...item, label: formatDateLabel(item.date) }));
  }, [data]);

  const totals = isFinancialSeries(data)
    ? data.totals
    : { costPrice: 0, totalRevenue: 0, profit: 0, profitMarginPercent: 0 };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tài chính</CardTitle>
          <CardDescription className='text-destructive'>
            Không thể tải dữ liệu tài chính: {error.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2'>
          Cost price / Doanh thu / Lợi nhuận
          <Badge variant='outline'>Lợi nhuận {formatVnd(totals.profit)}</Badge>
        </CardTitle>
        <CardDescription>
          Tổng doanh thu {formatVnd(totals.totalRevenue)} · Cost price {formatVnd(totals.costPrice)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={financialComparisonConfig} className='h-[280px] w-full'>
          <AreaChart accessibilityLayer data={chartData} margin={{ left: 8, right: 8 }}>
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
                        {financialComparisonConfig[name as keyof typeof financialComparisonConfig]
                          ?.label ?? name}
                      </span>
                      <span className='font-mono font-medium'>{formatVnd(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <defs>
              <linearGradient id='fill-cost-price' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-costPrice)' stopOpacity={0.45} />
                <stop offset='95%' stopColor='var(--color-costPrice)' stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id='fill-total-revenue' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-totalRevenue)' stopOpacity={0.45} />
                <stop offset='95%' stopColor='var(--color-totalRevenue)' stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id='fill-profit' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-profit)' stopOpacity={0.45} />
                <stop offset='95%' stopColor='var(--color-profit)' stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey='costPrice'
              type='monotone'
              fill='url(#fill-cost-price)'
              stroke='var(--color-costPrice)'
              strokeWidth={2}
            />
            <Area
              dataKey='totalRevenue'
              type='monotone'
              fill='url(#fill-total-revenue)'
              stroke='var(--color-totalRevenue)'
              strokeWidth={2}
            />
            <Area
              dataKey='profit'
              type='monotone'
              fill='url(#fill-profit)'
              stroke='var(--color-profit)'
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        {isLoading ? (
          <p className='text-muted-foreground mt-3 text-sm'>Đang tải dữ liệu...</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
