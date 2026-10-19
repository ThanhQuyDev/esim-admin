'use client';

import { useQuery } from '@tanstack/react-query';
import { Cell, Label, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { formatNumber } from '@/lib/format';
import { ordersByDeviceQueryOptions } from '../api/queries';
import type { OrderDeviceType, OverviewFilters } from '../api/types';

/**
 * Successful orders by desktop / mobile / tablet (doitac-1410 #083).
 *
 * Fixed hue per device, never by rank, from the validated categorical palette
 * (light and dark steps); "unknown" is a neutral gray. One hue sits below 3:1
 * on the light surface, so every slice also has a text row with its count and
 * share beside the chart.
 */
const DEVICE_CONFIG = {
  desktop: { label: 'Máy tính', color: 'var(--device-desktop)' },
  mobile: { label: 'Di động', color: 'var(--device-mobile)' },
  tablet: { label: 'Máy tính bảng', color: 'var(--device-tablet)' },
  unknown: { label: 'Không rõ', color: 'var(--device-unknown)' }
} satisfies ChartConfig;

/**
 * The hues as CSS variables on the card, light and dark steps, so the chart
 * and the legend beside it (outside the chart's own scope) read the same ones.
 */
const DEVICE_COLOR_VARS =
  '[--device-desktop:#2a78d6] [--device-mobile:#eb6834] [--device-tablet:#1baf7a] [--device-unknown:#898781] ' +
  'dark:[--device-desktop:#3987e5] dark:[--device-mobile:#d95926] dark:[--device-tablet:#199e70]';

interface DeviceGraphProps {
  filters?: OverviewFilters;
}

export function DeviceGraph({ filters }: DeviceGraphProps) {
  const { data, isLoading, error } = useQuery(ordersByDeviceQueryOptions(filters));
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const chartData = rows.map((row) => ({
    ...row,
    label: DEVICE_CONFIG[row.deviceType].label,
    fill: `var(--device-${row.deviceType})`
  }));

  return (
    <Card className='h-full' data-testid='device-graph'>
      <CardHeader>
        <CardTitle>Đơn thành công theo thiết bị</CardTitle>
        <CardDescription>Số đơn và tỷ lệ % theo loại thiết bị khách dùng khi đặt</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='bg-muted h-[220px] animate-pulse rounded-lg' />
        ) : error ? (
          <p className='text-destructive text-sm'>{error.message}</p>
        ) : total === 0 ? (
          <p className='text-muted-foreground py-16 text-center text-sm'>
            Chưa có đơn thành công trong khoảng thời gian này.
          </p>
        ) : (
          <div className={`flex flex-col items-center gap-6 sm:flex-row ${DEVICE_COLOR_VARS}`}>
            <ChartContainer
              config={DEVICE_CONFIG}
              className='aspect-square h-[220px] w-[220px] shrink-0'
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      nameKey='deviceType'
                      formatter={(value, _name, item) => (
                        <span className='flex w-full justify-between gap-3'>
                          <span className='text-muted-foreground'>
                            {DEVICE_CONFIG[item.payload.deviceType as OrderDeviceType].label}
                          </span>
                          <span className='text-foreground font-mono font-medium tabular-nums'>
                            {formatNumber(Number(value))} đơn · {item.payload.percent}%
                          </span>
                        </span>
                      )}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey='orders'
                  nameKey='deviceType'
                  innerRadius={62}
                  outerRadius={100}
                  // A 2px surface gap between slices.
                  stroke='var(--card)'
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.deviceType} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !('cx' in viewBox)) return null;
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor='middle'
                          className='pointer-events-none'
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) - 4}
                            className='fill-foreground text-2xl font-semibold'
                          >
                            {formatNumber(total)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 16}
                            className='fill-muted-foreground text-xs'
                          >
                            đơn
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Legend and table in one: a swatch for identity, the numbers in text ink. */}
            <ul className='w-full space-y-2 text-sm' data-testid='device-legend'>
              {chartData.map((row) => (
                <li
                  key={row.deviceType}
                  className='flex items-center gap-2'
                  data-testid={`device-row-${row.deviceType}`}
                >
                  <span
                    className='h-3 w-3 shrink-0 rounded-[3px]'
                    style={{ backgroundColor: row.fill }}
                    aria-hidden='true'
                  />
                  <span className='flex-1'>{row.label}</span>
                  <span className='font-mono tabular-nums'>{formatNumber(row.orders)}</span>
                  <span className='text-muted-foreground w-14 text-right font-mono tabular-nums'>
                    {row.percent}%
                  </span>
                </li>
              ))}
              {rows.some((row) => row.deviceType === 'unknown') && (
                <li className='text-muted-foreground pt-1 text-xs'>
                  Không rõ: đơn tạo trong CMS hoặc đặt trước khi hệ thống ghi nhận thiết bị.
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
