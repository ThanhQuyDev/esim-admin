'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { formatNumber, formatVnd } from '@/lib/format';
import { topDestinationsQueryOptions } from '../api/queries';

const destinationChartConfig = {
  plansPurchased: {
    label: 'Plan đã mua',
    color: 'var(--chart-4)'
  },
  revenue: {
    label: 'Doanh thu',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

interface PieGraphProps {
  filters?: import('../api/types').OverviewFilters;
}

export function PieGraph({ filters }: PieGraphProps) {
  const { data, isLoading, error } = useQuery(
    topDestinationsQueryOptions({ ...filters, limit: 10 })
  );

  const chartData = useMemo(() => {
    return (data?.data ?? []).map((item) => ({
      ...item,
      destinationLabel:
        item.destinationName.length > 14
          ? `${item.destinationName.slice(0, 14)}…`
          : item.destinationName
    }));
  }, [data]);

  if (error) {
    return (
      <Card className='flex h-full flex-col'>
        <CardHeader>
          <CardTitle>Top destinations</CardTitle>
          <CardDescription className='text-destructive'>
            Không thể tải dữ liệu destination: {error.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader>
        <CardTitle>Destination mua plan nhiều</CardTitle>
        <CardDescription>Top destination theo số lượng plan đã mua</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col justify-center'>
        <ChartContainer config={destinationChartConfig} className='h-[280px] w-full'>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout='vertical'
            margin={{ left: 8, right: 16 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray='3 3' />
            <XAxis type='number' hide />
            <YAxis
              dataKey='destinationLabel'
              type='category'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={92}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => {
                    const payload = item.payload as {
                      destinationName?: string;
                      revenue?: number;
                    };
                    return (
                      <div className='grid min-w-[190px] gap-1'>
                        <div className='font-medium'>{payload.destinationName}</div>
                        <div className='flex items-center justify-between gap-3'>
                          <span className='text-muted-foreground'>Plan đã mua</span>
                          <span className='font-mono font-medium'>
                            {formatNumber(Number(value))}
                          </span>
                        </div>
                        <div className='flex items-center justify-between gap-3'>
                          <span className='text-muted-foreground'>Doanh thu</span>
                          <span className='font-mono font-medium'>
                            {formatVnd(payload.revenue)}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey='plansPurchased' fill='var(--color-plansPurchased)' radius={5} />
          </BarChart>
        </ChartContainer>
        {isLoading ? (
          <p className='text-muted-foreground mt-3 text-sm'>Đang tải dữ liệu...</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
