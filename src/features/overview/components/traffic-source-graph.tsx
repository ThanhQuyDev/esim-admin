'use client';

/**
 * "Nguồn truy cập" on Tổng quan (vande-0411 #052): paid web orders by where they
 * came from. A ring of the kinds of source, each kind always in its own colour
 * so a filter never repaints it; the table beside names every source inside
 * them, with the count and share, so colour is never the only way to read it.
 */

import { useQuery } from '@tanstack/react-query';
import { Cell, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { formatNumber } from '@/lib/format';
import { overviewTrafficSourcesQueryOptions } from '../api/queries';
import type { OverviewFilters } from '../api/types';

const GROUP_LABEL: Record<string, string> = {
  ads: 'Quảng cáo',
  social: 'Mạng xã hội',
  search: 'Tìm kiếm',
  ai: 'Trợ lý AI',
  partner: 'Đối tác',
  referral: 'Web, ứng dụng khác',
  direct: 'Trực tiếp',
  hidden: 'Từ link, không rõ nơi',
  unknown: 'Không rõ'
};

/** Light and dark steps; the slots follow the validated categorical order. */
const COLOR_VARS =
  '[--src-ads:#2a78d6] [--src-social:#eb6834] [--src-search:#1baf7a] [--src-ai:#eda100] ' +
  '[--src-partner:#e87ba4] [--src-referral:#008300] [--src-direct:#6250d6] [--src-hidden:#e34948] ' +
  '[--src-unknown:#898781] ' +
  'dark:[--src-ads:#3987e5] dark:[--src-social:#d95926] dark:[--src-search:#199e70] ' +
  'dark:[--src-ai:#c98500] dark:[--src-partner:#d55181] dark:[--src-direct:#9085e9] ' +
  'dark:[--src-hidden:#e66767]';

const chartConfig = {} satisfies ChartConfig;

type Slice = { group: string; label: string; orders: number; percent: number };

function SliceTooltip({ active, payload }: { active?: boolean; payload?: { payload: Slice }[] }) {
  const slice = active ? payload?.[0]?.payload : null;
  if (!slice) return null;
  return (
    <div className='bg-background rounded-md border px-2.5 py-1.5 text-xs shadow-sm'>
      <p className='font-medium'>{slice.label}</p>
      <p className='text-muted-foreground tabular-nums'>
        {formatNumber(slice.orders)} đơn · {slice.percent}%
      </p>
    </div>
  );
}

export function TrafficSourceGraph({ filters }: { filters?: OverviewFilters }) {
  const { data, error, isLoading } = useQuery(overviewTrafficSourcesQueryOptions(filters));
  const groups = data?.groups ?? [];
  const slices: Slice[] = groups.map((group) => ({
    group: group.group,
    label: GROUP_LABEL[group.group] ?? group.group,
    orders: group.orders,
    percent: group.percent
  }));

  return (
    <Card className={`h-full ${COLOR_VARS}`} data-testid='traffic-sources'>
      <CardHeader>
        <CardTitle>Nguồn truy cập</CardTitle>
        <CardDescription className={error ? 'text-destructive' : undefined}>
          {error
            ? `Không thể tải dữ liệu: ${error.message}`
            : 'Đơn hàng thành công theo nơi khách đến, tính theo trang đầu tiên của phiên'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='bg-muted h-40 animate-pulse rounded-md' data-testid='traffic-loading' />
        ) : slices.length === 0 ? (
          <div className='text-muted-foreground bg-muted flex h-40 items-center justify-center rounded-md text-sm'>
            Chưa có đơn hàng nào được ghi nhận nguồn trong khoảng này
          </div>
        ) : (
          <div className='grid items-center gap-6 md:grid-cols-[260px_1fr]'>
            <div className='relative mx-auto h-[240px] w-[240px]'>
              {/* Under the chart, so a tooltip covers it rather than the reverse. */}
              <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
                <span className='text-2xl font-semibold tabular-nums'>
                  {formatNumber(data?.total ?? 0)}
                </span>
                <span className='text-muted-foreground text-xs'>đơn</span>
              </div>
              <ChartContainer config={chartConfig} className='relative z-10 h-full w-full'>
                <PieChart>
                  <ChartTooltip content={<SliceTooltip />} />
                  <Pie
                    data={slices}
                    dataKey='orders'
                    nameKey='label'
                    innerRadius={70}
                    outerRadius={110}
                    // A 2px surface gap between the parts.
                    paddingAngle={slices.length > 1 ? 1 : 0}
                    stroke='var(--card)'
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.group} fill={`var(--src-${slice.group})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-muted-foreground text-xs'>
                  <th className='py-1 text-left font-normal'>Nguồn</th>
                  <th className='py-1 text-right font-normal'>Đơn hàng</th>
                  <th className='py-1 text-right font-normal'>Tỷ lệ</th>
                </tr>
              </thead>
              {groups.map((group) => (
                <tbody key={group.group} data-testid={`traffic-group-${group.group}`}>
                  <tr className='border-t font-medium'>
                    <td className='py-1.5'>
                      <span className='flex items-center gap-2'>
                        <span
                          className='size-3 shrink-0 rounded-[3px]'
                          style={{ backgroundColor: `var(--src-${group.group})` }}
                          aria-hidden='true'
                        />
                        {GROUP_LABEL[group.group] ?? group.group}
                      </span>
                    </td>
                    <td className='py-1.5 text-right tabular-nums'>{formatNumber(group.orders)}</td>
                    <td className='py-1.5 text-right tabular-nums'>{group.percent}%</td>
                  </tr>
                  {/* The kind already says it all when it holds one source of that name. */}
                  {group.sources
                    .filter((row) => row.source !== GROUP_LABEL[group.group])
                    .map((row) => (
                      <tr key={row.source} className='text-muted-foreground'>
                        <td className='py-1 pl-5 break-all'>{row.source}</td>
                        <td className='py-1 text-right tabular-nums'>{formatNumber(row.orders)}</td>
                        <td className='py-1 text-right tabular-nums'>{row.percent}%</td>
                      </tr>
                    ))}
                </tbody>
              ))}
            </table>
          </div>
        )}
        {(data?.unrecorded ?? 0) > 0 && (
          <p className='text-muted-foreground mt-3 text-xs' data-testid='traffic-unrecorded'>
            Không tính {formatNumber(data?.unrecorded ?? 0)} đơn chưa có nguồn: đơn đặt trước khi có
            chức năng này, đơn đặt hộ trong CMS.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
