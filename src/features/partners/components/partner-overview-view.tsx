'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';
// The portal's filter is the admin console's own filter with the provider
// select left off (#053); sharing it keeps the two screens behaving the same
// rather than drifting into two ideas of what "7 ngày qua" means.
import {
  DEFAULT_PORTAL_PERIOD,
  PortalPeriodFilter,
  periodLabel,
  resolvePeriod,
  type PortalPeriod
} from '@/features/partner-portal/components/portal-period-filter';

import {
  partnerActivityByTypeQueryOptions,
  partnerOverviewQueryOptions,
  partnerRevenueByTypeQueryOptions,
  partnerSeriesByTypeQueryOptions,
  partnerTopDestinationsQueryOptions,
  topPartnersQueryOptions
} from '../api/queries';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className='rounded-lg border p-4'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='mt-1 text-2xl font-semibold'>{value}</p>
      {hint && <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>}
    </div>
  );
}

/** A queue item worth an admin's attention, linking straight to where it's cleared. */
function QueueRow({
  label,
  count,
  amount,
  href
}: {
  label: string;
  count: number;
  amount?: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className='hover:bg-accent flex items-center justify-between rounded-lg border p-3 transition-colors'
    >
      <div>
        <p className='text-sm font-medium'>{label}</p>
        {amount !== undefined && (
          <p className='text-muted-foreground mt-1 text-xs'>{formatVnd(amount)}</p>
        )}
      </div>
      <Badge variant={count > 0 ? 'default' : 'secondary'}>{count}</Badge>
    </Link>
  );
}

const PARTNER_TYPE_LABEL: Record<string, string> = {
  kol: 'KOL',
  distribution: 'Phân phối',
  api: 'API'
};

/**
 * Growth against the same span immediately before (#050).
 *
 * Shown beside the figure rather than as a number on its own: "12,4 triệu" says
 * nothing until you know whether last month was 6 or 30.
 */
/**
 * A headline number with its split by partner type underneath (#051).
 *
 * The split is the point: "42 đối tác đang hoạt động" hides whether that is 40
 * KOLs and 2 distributors or the other way round, and the two mean different
 * things for where the programme needs attention.
 */
function StatByType({
  label,
  value,
  hint,
  rows
}: {
  label: string;
  value: string;
  hint?: string;
  rows: { partnerType: string; count: number }[];
}) {
  return (
    <div className='rounded-lg border p-4'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='mt-1 text-2xl font-semibold tabular-nums'>{value}</p>
      {hint && <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>}
      {rows.length > 0 && (
        <div className='mt-3 space-y-1'>
          {rows.map((row) => (
            <div key={row.partnerType} className='flex justify-between gap-2 text-xs'>
              <span className='text-muted-foreground'>
                {PARTNER_TYPE_LABEL[row.partnerType] ?? row.partnerType}
              </span>
              <span className='tabular-nums'>{row.count.toLocaleString('vi-VN')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** One colour per partner type, so the two charts read as one picture. */
const TYPE_COLOR: Record<string, string> = {
  kol: 'var(--chart-1)',
  distribution: 'var(--chart-2)',
  api: 'var(--chart-3)'
};

const destinationConfig = {
  plansPurchased: { label: 'eSIM', color: 'var(--chart-1)' }
} satisfies ChartConfig;

/** A bucket start as the axis should read it. */
function bucketLabel(bucket: string, groupBy: string): string {
  const d = new Date(bucket);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  if (groupBy === 'year') return String(d.getFullYear());
  if (groupBy === 'month') return `${mm}/${d.getFullYear()}`;
  if (groupBy === 'week') return `Tuần ${dd}/${mm}`;
  return `${dd}/${mm}`;
}

function GrowthBadge({ percent }: { percent: number }) {
  if (percent === 0) return <Badge variant='secondary'>Không đổi</Badge>;
  const up = percent > 0;
  return (
    <Badge
      variant='outline'
      className={
        up
          ? 'border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-400'
          : 'border-red-200 text-red-700 dark:border-red-900 dark:text-red-400'
      }
    >
      {up ? '+' : ''}
      {percent}% so với kỳ trước
    </Badge>
  );
}

export function PartnerOverviewView() {
  // #053: the whole screen answers for one period, so the filter sits above it
  // and every figure below follows it — a header that says "30 ngày" over
  // numbers from another window is worse than no header.
  const [period, setPeriod] = useState<PortalPeriod>(DEFAULT_PORTAL_PERIOD);
  const range = useMemo(() => resolvePeriod(period), [period]);
  const rangeLabel = periodLabel(period);

  const { data, isLoading } = useQuery(partnerOverviewQueryOptions());
  const { data: revenue } = useQuery(partnerRevenueByTypeQueryOptions(range));
  const { data: activity } = useQuery(partnerActivityByTypeQueryOptions(range));
  const { data: series } = useQuery(
    partnerSeriesByTypeQueryOptions({ ...range, groupBy: period.groupBy })
  );
  const { data: destinations = [] } = useQuery(partnerTopDestinationsQueryOptions(range));
  const { data: leaders = [] } = useQuery(topPartnersQueryOptions({ ...range, limit: 30 }));

  // Recharts wants one row per bucket with a column per series, so the types
  // are pivoted here rather than shipped that way — which types exist is a
  // question for the data, not for this file.
  const seriesTypes = useMemo(() => {
    const all = new Set<string>();
    for (const point of series?.points ?? []) {
      for (const row of point.byType) all.add(row.partnerType);
    }
    return [...all].toSorted();
  }, [series]);

  const chartData = useMemo(
    () =>
      (series?.points ?? []).map((point) => {
        const row: Record<string, string | number> = {
          label: bucketLabel(point.bucket, period.groupBy)
        };
        for (const type of seriesTypes) {
          const found = point.byType.find((r) => r.partnerType === type);
          row[`revenue_${type}`] = found?.revenueVnd ?? 0;
          row[`orders_${type}`] = found?.orders ?? 0;
        }
        return row;
      }),
    [series, seriesTypes, period.groupBy]
  );

  const revenueConfig = useMemo(
    () =>
      Object.fromEntries(
        seriesTypes.map((type) => [
          `revenue_${type}`,
          {
            label: PARTNER_TYPE_LABEL[type] ?? type,
            color: TYPE_COLOR[type] ?? 'var(--chart-4)'
          }
        ])
      ) satisfies ChartConfig,
    [seriesTypes]
  );

  const ordersConfig = useMemo(
    () =>
      Object.fromEntries(
        seriesTypes.map((type) => [
          `orders_${type}`,
          {
            label: PARTNER_TYPE_LABEL[type] ?? type,
            color: TYPE_COLOR[type] ?? 'var(--chart-4)'
          }
        ])
      ) satisfies ChartConfig,
    [seriesTypes]
  );

  if (isLoading || !data) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  const { partners, queue, money } = data;

  return (
    <div className='space-y-6'>
      <PortalPeriodFilter value={period} onChange={setPeriod} />

      {/* What needs a human today */}
      <div>
        <p className='mb-3 text-sm font-medium'>Luồng công việc hôm nay</p>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <QueueRow
            label='Hồ sơ chờ duyệt'
            count={queue.pendingApprovals}
            href='/dashboard/partners/approvals'
          />
          <QueueRow
            label='Yêu cầu rút tiền'
            count={queue.pendingPayouts}
            amount={queue.pendingPayoutVnd}
            href='/dashboard/partners/payouts'
          />
          <QueueRow
            label='Ký quỹ chờ xác nhận'
            count={queue.pendingDeposits}
            href='/dashboard/partners/deposit-requests'
          />
          <QueueRow
            label='Hoa hồng chờ ghi nhận'
            count={queue.pendingCommissions}
            amount={queue.pendingCommissionVnd}
            href='/dashboard/partners/commissions'
          />
        </div>
      </div>

      {/* Programme size, measured by what actually happened (#051) */}
      <div>
        <p className='mb-3 text-sm font-medium'>Quy mô chương trình · {rangeLabel}</p>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <StatByType
            label='Tổng số đơn hàng'
            value={(activity?.orders.total ?? 0).toLocaleString('vi-VN')}
            rows={(activity?.orders.byType ?? []).map((r) => ({
              partnerType: r.partnerType,
              count: r.orders
            }))}
          />
          <StatByType
            label='Đối tác đang hoạt động'
            value={(activity?.activePartners.total ?? 0).toLocaleString('vi-VN')}
            hint={`Có phát sinh giao dịch trong kỳ · tổng ${partners.total} hồ sơ`}
            rows={(activity?.activePartners.byType ?? []).map((r) => ({
              partnerType: r.partnerType,
              count: r.partners
            }))}
          />
          <StatByType
            label='Hồ sơ chờ duyệt'
            value={(activity?.pendingApprovals.total ?? 0).toLocaleString('vi-VN')}
            rows={(activity?.pendingApprovals.byType ?? []).map((r) => ({
              partnerType: r.partnerType,
              count: r.partners
            }))}
          />
          <Stat
            label='Hoa hồng cần đối soát'
            value={formatVnd(activity?.commissionToReconcile.totalVnd ?? 0)}
            hint={`${activity?.commissionToReconcile.partners ?? 0} đối tác đang chờ đối soát`}
          />
        </div>
        <div className='mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <Stat label='Tạm giữ / Đã khóa' value={`${partners.hold} / ${partners.disabled}`} />
        </div>
      </div>

      {/*
        What esim.vn actually keeps, by kind of partner (#050). Deliberately
        above the gross figures below: the money that stays is the one an admin
        is answerable for, and reading the two the wrong way round is how a
        programme looks twice as profitable as it is.
      */}
      {revenue && (
        <div>
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <p className='text-sm font-medium'>Doanh thu esim.vn thu về · {rangeLabel}</p>
            <Badge variant='outline'>{formatVnd(revenue.totalRevenueVnd)}</Badge>
            <GrowthBadge percent={revenue.growthPercent} />
          </div>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {revenue.byType.map((row) => (
              <div key={row.partnerType} className='rounded-lg border p-4'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-sm font-medium'>
                    {PARTNER_TYPE_LABEL[row.partnerType] ?? row.partnerType}
                  </p>
                  <Badge variant='secondary'>{row.partners} đối tác</Badge>
                </div>
                <p className='mt-1 text-2xl font-semibold tabular-nums'>
                  {formatVnd(row.revenueVnd)}
                </p>
                <div className='mt-2'>
                  <GrowthBadge percent={row.growthPercent} />
                </div>
                <div className='text-muted-foreground mt-3 space-y-1 text-xs'>
                  {row.attributedGrossVnd > 0 && (
                    <div className='flex justify-between gap-2'>
                      <span>Đơn ghi nhận</span>
                      <span className='tabular-nums'>{formatVnd(row.attributedGrossVnd)}</span>
                    </div>
                  )}
                  {row.commissionVnd > 0 && (
                    <div className='flex justify-between gap-2'>
                      <span>Trừ hoa hồng</span>
                      <span className='tabular-nums'>−{formatVnd(row.commissionVnd)}</span>
                    </div>
                  )}
                  {row.purchasesVnd > 0 && (
                    <div className='flex justify-between gap-2'>
                      <span>Đối tác mua vào</span>
                      <span className='tabular-nums'>{formatVnd(row.purchasesVnd)}</span>
                    </div>
                  )}
                  {row.revenueVnd === 0 && <p>Chưa phát sinh trong kỳ.</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Money moved through partners */}
      <div>
        <p className='mb-3 text-sm font-medium'>Doanh số & hoa hồng 30 ngày</p>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <Stat label='Doanh số quy về đối tác' value={formatVnd(money.revenue30dVnd)} />
          <Stat label='Số đơn' value={String(money.orders30d)} />
          <Stat label='Hoa hồng 30 ngày' value={formatVnd(money.commission30dVnd)} />
          <Stat
            label='Hoa hồng lũy kế'
            value={formatVnd(money.commissionTotalVnd)}
            hint='Không tính khoản đã hoàn'
          />
        </div>
      </div>

      {/* How it moved, and where it went (#052) */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
        <div className='lg:col-span-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex flex-wrap items-center gap-2'>
                Doanh thu theo loại đối tác
                <Badge variant='outline'>{rangeLabel}</Badge>
              </CardTitle>
              <CardDescription>
                Tiền esim.vn thu về thực tế — đối tác tiếp thị đã trừ hoa hồng, đối tác phân phối là
                giá mua vào.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className='text-muted-foreground py-16 text-center text-sm'>
                  Chưa có đơn nào trong kỳ này.
                </p>
              ) : (
                <ChartContainer config={revenueConfig} className='h-[260px] w-full'>
                  <BarChart accessibilityLayer data={chartData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray='3 3' />
                    <XAxis
                      dataKey='label'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      interval='preserveStartEnd'
                      minTickGap={24}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={56}
                      tickFormatter={(value) =>
                        new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(
                          Number(value)
                        )
                      }
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Legend />
                    {seriesTypes.map((type) => (
                      <Bar
                        key={type}
                        dataKey={`revenue_${type}`}
                        stackId='revenue'
                        fill={TYPE_COLOR[type] ?? 'var(--chart-4)'}
                        name={PARTNER_TYPE_LABEL[type] ?? type}
                        radius={2}
                      />
                    ))}
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className='mt-4'>
            <CardHeader>
              <CardTitle className='flex flex-wrap items-center gap-2'>
                Số đơn theo loại đối tác
                <Badge variant='outline'>{rangeLabel}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className='text-muted-foreground py-16 text-center text-sm'>
                  Chưa có đơn nào trong kỳ này.
                </p>
              ) : (
                <ChartContainer config={ordersConfig} className='h-[220px] w-full'>
                  <BarChart accessibilityLayer data={chartData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray='3 3' />
                    <XAxis
                      dataKey='label'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      interval='preserveStartEnd'
                      minTickGap={24}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={40}
                      allowDecimals={false}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Legend />
                    {seriesTypes.map((type) => (
                      <Bar
                        key={type}
                        dataKey={`orders_${type}`}
                        stackId='orders'
                        fill={TYPE_COLOR[type] ?? 'var(--chart-4)'}
                        name={PARTNER_TYPE_LABEL[type] ?? type}
                        radius={2}
                      />
                    ))}
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='lg:col-span-3'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle className='flex flex-wrap items-center gap-2'>
                Điểm đến mua nhiều
                <Badge variant='outline'>{rangeLabel}</Badge>
              </CardTitle>
              <CardDescription>
                Xếp theo số eSIM bán ra từ đơn có đối tác — của cả hai chương trình.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {destinations.length === 0 ? (
                <p className='text-muted-foreground py-16 text-center text-sm'>
                  Chưa có đơn nào trong kỳ này.
                </p>
              ) : (
                <ChartContainer config={destinationConfig} className='h-[420px] w-full'>
                  <BarChart
                    accessibilityLayer
                    layout='vertical'
                    data={destinations}
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray='3 3' />
                    <XAxis
                      type='number'
                      dataKey='plansPurchased'
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type='category'
                      dataKey='name'
                      tickLine={false}
                      axisLine={false}
                      width={110}
                      tickMargin={8}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(
                            value: unknown,
                            _name: unknown,
                            item: { payload?: { revenueVnd?: number } }
                          ) => (
                            <div className='flex min-w-[180px] flex-col gap-0.5'>
                              <span className='font-medium'>{Number(value)} eSIM</span>
                              <span className='text-muted-foreground'>
                                {formatVnd(Number(item?.payload?.revenueVnd ?? 0))} doanh số
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar dataKey='plansPurchased' fill='var(--color-plansPurchased)' radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/*
        Top 30 by revenue, at the foot of the page (#054). Ranked on the same
        money as everything above — what esim.vn keeps — so the table and the
        totals cannot tell different stories.
      */}
      <Card>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Top 30 đối tác dẫn đầu về doanh thu
            <Badge variant='outline'>{rangeLabel}</Badge>
          </CardTitle>
          <CardDescription>
            Doanh thu là số tiền esim.vn thu về: đối tác tiếp thị đã trừ hoa hồng, đối tác phân phối
            là giá mua vào.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaders.length === 0 ? (
            <p className='text-muted-foreground py-12 text-center text-sm'>
              Chưa có đơn hàng nào quy về đối tác trong kỳ này.
            </p>
          ) : (
            <div className='overflow-x-auto rounded-lg border'>
              <Table>
                <TableHeader className='bg-muted'>
                  <TableRow>
                    <TableHead className='w-12'>#</TableHead>
                    <TableHead>Đối tác</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Hạng</TableHead>
                    <TableHead className='text-right'>Số đơn</TableHead>
                    <TableHead className='text-right'>Hoa hồng</TableHead>
                    <TableHead className='text-right'>Doanh thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaders.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell className='text-muted-foreground tabular-nums'>
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/partners/${row.id}`}
                          className='font-medium hover:underline'
                        >
                          {row.contactName || `#${row.id}`}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>
                          {PARTNER_TYPE_LABEL[row.partnerType] ?? row.partnerType}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-xs'>{row.tierCode ?? '—'}</TableCell>
                      <TableCell className='text-right tabular-nums'>{row.orders}</TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.commissionVnd > 0 ? formatVnd(row.commissionVnd) : '—'}
                      </TableCell>
                      <TableCell className='text-right font-medium tabular-nums'>
                        {formatVnd(row.revenueVnd)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
