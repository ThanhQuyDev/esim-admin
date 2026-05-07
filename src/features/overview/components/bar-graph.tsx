'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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
import { formatNumber, formatPercent, formatVnd } from '@/lib/format';
import { providerComparisonQueryOptions } from '../api/queries';
import type { ProviderMetric, ProviderComparisonByProviderResponse } from '../api/types';

const providerComparisonConfig = {
  orders: {
    label: 'Đơn hàng',
    color: 'var(--chart-1)'
  },
  revenue: {
    label: 'Doanh thu',
    color: 'var(--chart-2)'
  },
  plansSold: {
    label: 'Plan đã bán',
    color: 'var(--chart-3)'
  },
  successRate: {
    label: 'Tỷ lệ thành công',
    color: 'var(--chart-4)'
  }
} satisfies ChartConfig;

const providerLabels: Record<string, string> = {
  airalo: 'Airalo',
  esimaccess: 'eSIM Access',
  gadgetkorea: 'Gadget Korea'
};

function isProviderComparisonByProvider(
  data: unknown
): data is ProviderComparisonByProviderResponse {
  return typeof data === 'object' && data !== null && 'data' in data;
}

function formatMetricValue(metric: ProviderMetric, value: number) {
  if (metric === 'revenue') return formatVnd(value);
  if (metric === 'successRate') return formatPercent(value);
  return formatNumber(value);
}

export function BarGraph() {
  const metric: ProviderMetric = 'orders';
  const { data, isLoading, error } = useQuery(
    providerComparisonQueryOptions({ metric, groupBy: 'provider' })
  );

  const chartData = useMemo(() => {
    if (!isProviderComparisonByProvider(data)) return [];

    return data.data.map((item) => ({
      ...item,
      providerLabel: providerLabels[item.provider] ?? item.provider
    }));
  }, [data]);

  const total = chartData.reduce((sum, item) => sum + item[metric], 0);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>So sánh provider</CardTitle>
          <CardDescription className='text-destructive'>
            Không thể tải dữ liệu provider: {error.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          So sánh provider
          <Badge variant='outline'>{formatMetricValue(metric, total)}</Badge>
        </CardTitle>
        <CardDescription>
          So sánh Airalo, eSIM Access và Gadget Korea theo số đơn hàng
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={providerComparisonConfig} className='h-[280px] w-full'>
          <BarChart accessibilityLayer data={chartData} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis dataKey='providerLabel' tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <div className='flex min-w-[160px] items-center justify-between gap-3'>
                      <span className='text-muted-foreground'>
                        {providerComparisonConfig[name as keyof typeof providerComparisonConfig]
                          ?.label ?? name}
                      </span>
                      <span className='font-mono font-medium'>
                        {formatMetricValue(metric, Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey={metric} fill={`var(--color-${metric})`} radius={6} />
          </BarChart>
        </ChartContainer>
        {isLoading ? (
          <p className='text-muted-foreground mt-3 text-sm'>Đang tải dữ liệu...</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
