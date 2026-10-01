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

/** Was 10; the card is now tall enough to read more of the list (#007). */
const DESTINATION_LIMIT = 15;

/** Vertical room one bar needs for its label to stay legible. */
const ROW_HEIGHT = 34;

const MAX_LABEL_CHARS = 18;

export function PieGraph({ filters }: PieGraphProps) {
  const { data, isLoading, error } = useQuery(
    topDestinationsQueryOptions({ ...filters, limit: DESTINATION_LIMIT })
  );

  const chartData = useMemo(() => {
    return (data?.data ?? []).map((item, index) => {
      // A row whose name came back empty used to render a bar with nothing
      // beside it (#007).
      const name = item.destinationName?.trim() || 'Không rõ';
      return {
        ...item,
        destinationName: name,
        // The category axis keys on this, and recharts collapses duplicate
        // category values — two destinations with the same name, or two long
        // names that truncated to the same string, silently lost their tick.
        // The index makes every key unique; `tickFormatter` turns it back into
        // a label.
        destinationKey: `${index}|${name}`,
        destinationLabel:
          name.length > MAX_LABEL_CHARS ? `${name.slice(0, MAX_LABEL_CHARS)}…` : name
      };
    });
  }, [data]);

  // Grow with the number of bars so no label has to be dropped for space.
  const chartMinHeight = Math.max(320, chartData.length * ROW_HEIGHT);

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
        <CardDescription>
          Top {DESTINATION_LIMIT} destination theo số lượng plan đã mua
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col justify-center'>
        {/* flex-1 + a row-count minimum: the card is stretched to the height of
            "Lợi nhuận theo provider" beside it, and the chart fills it instead
            of staying pinned at 280px (#007). */}
        <ChartContainer
          config={destinationChartConfig}
          className='w-full flex-1'
          style={{ minHeight: chartMinHeight }}
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            layout='vertical'
            margin={{ left: 8, right: 16 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray='3 3' />
            <XAxis type='number' hide />
            <YAxis
              dataKey='destinationKey'
              type='category'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={118}
              // Recharts drops ticks it thinks will not fit, which is the other
              // half of the missing-name bug: with 10+ bars in a short chart it
              // rendered bars with no name next to them. 0 = draw every tick.
              interval={0}
              tickFormatter={(value: string) =>
                chartData.find((row) => row.destinationKey === value)?.destinationLabel ?? ''
              }
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
