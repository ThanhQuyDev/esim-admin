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
import { financialComparisonQueryOptions } from '../api/queries';
import type { FinancialComparisonGroupedResponse, OverviewFilters } from '../api/types';

/**
 * Each sale's revenue split into what goes to the supplier, what goes to the
 * partner and what esim.vn keeps (vande #016). Fixed colours, not theme slots:
 * the three must stay apart for colour-blind readers in every theme (checked
 * with the dataviz palette validator, light and dark).
 */
const profitBySourceConfig = {
  costPrice: { label: 'Giá vốn', color: '#3b6fd4' },
  partnerCommission: { label: 'Hoa hồng đối tác', color: '#d0459a' },
  profit: { label: 'Lợi nhuận', color: '#16a34a' }
} satisfies ChartConfig;

export const ORDER_SOURCE_LABELS: Record<string, string> = {
  direct: 'Khách mua trực tiếp',
  partner_referral: 'Khách qua link/mã đối tác',
  partner_purchase: 'Đối tác mua bằng ví'
};

function isGrouped(data: unknown): data is FinancialComparisonGroupedResponse {
  return typeof data === 'object' && data !== null && 'data' in data;
}

export function ProfitBySourceGraph({ filters }: { filters?: OverviewFilters }) {
  const { data, isLoading, error } = useQuery(
    financialComparisonQueryOptions({ ...filters, groupBy: 'orderSource' })
  );

  const rows = useMemo(
    () =>
      isGrouped(data)
        ? data.data.map((row) => ({
            ...row,
            label: ORDER_SOURCE_LABELS[row.group] ?? row.group
          }))
        : [],
    [data]
  );
  const totals = isGrouped(data) ? data.totals : undefined;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lợi nhuận theo loại đơn</CardTitle>
          <CardDescription className='text-destructive'>
            Không thể tải dữ liệu: {error.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className='h-full' data-testid='profit-by-source'>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2'>
          Lợi nhuận theo loại đơn
          <Badge variant='outline'>
            Lợi nhuận {formatVnd(totals?.profit)} ·{' '}
            {formatPercent(totals?.profitMarginPercent ?? 0)}
          </Badge>
        </CardTitle>
        <CardDescription>
          Doanh thu mỗi loại đơn chia thành giá vốn, hoa hồng phải trả đối tác và phần mình giữ lại.
          Tổng hoa hồng trong kỳ {formatVnd(totals?.partnerCommission)}.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <ChartContainer config={profitBySourceConfig} className='h-[220px] w-full'>
          <BarChart
            accessibilityLayer
            data={rows}
            layout='vertical'
            margin={{ left: 8, right: 16 }}
            barCategoryGap={18}
          >
            <CartesianGrid horizontal={false} strokeDasharray='3 3' />
            <XAxis
              type='number'
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)
              }
            />
            <YAxis
              type='category'
              dataKey='label'
              tickLine={false}
              axisLine={false}
              width={110}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.08 }}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className='flex min-w-[180px] items-center justify-between gap-3'>
                      <span className='text-muted-foreground'>
                        {profitBySourceConfig[name as keyof typeof profitBySourceConfig]?.label ??
                          name}
                      </span>
                      <span className='font-mono font-medium'>{formatVnd(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {/* stroke = the card surface: a 2px gap between stacked segments. */}
            <Bar
              dataKey='costPrice'
              stackId='revenue'
              fill='var(--color-costPrice)'
              stroke='var(--card)'
              strokeWidth={2}
            />
            <Bar
              dataKey='partnerCommission'
              stackId='revenue'
              fill='var(--color-partnerCommission)'
              stroke='var(--card)'
              strokeWidth={2}
            />
            <Bar
              dataKey='profit'
              stackId='revenue'
              fill='var(--color-profit)'
              stroke='var(--card)'
              strokeWidth={2}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>

        {/* The same figures as a table: exact amounts, and the margin. */}
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[520px] text-sm tabular-nums'>
            <thead className='text-muted-foreground text-xs'>
              <tr className='border-b'>
                <th className='py-1.5 text-left font-medium'>Loại đơn</th>
                <th className='py-1.5 text-right font-medium'>Đơn</th>
                <th className='py-1.5 text-right font-medium'>Doanh thu</th>
                <th className='py-1.5 text-right font-medium'>Hoa hồng</th>
                <th className='py-1.5 text-right font-medium'>Lợi nhuận</th>
                <th className='py-1.5 text-right font-medium'>Tỷ suất</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.group} className='border-b last:border-0'>
                  <td className='py-1.5'>{row.label}</td>
                  <td className='py-1.5 text-right'>{formatNumber(row.orders ?? 0)}</td>
                  <td className='py-1.5 text-right'>{formatVnd(row.totalRevenue)}</td>
                  <td className='py-1.5 text-right'>{formatVnd(row.partnerCommission)}</td>
                  <td
                    className={`py-1.5 text-right font-medium ${row.profit < 0 ? 'text-destructive' : ''}`}
                  >
                    {formatVnd(row.profit)}
                  </td>
                  <td className='py-1.5 text-right'>{formatPercent(row.profitMarginPercent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading ? <p className='text-muted-foreground text-sm'>Đang tải dữ liệu...</p> : null}
      </CardContent>
    </Card>
  );
}
