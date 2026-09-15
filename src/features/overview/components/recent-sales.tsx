'use client';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatPercent, formatVnd } from '@/lib/format';
import { financialComparisonQueryOptions } from '../api/queries';
import type { FinancialComparisonGroupedResponse } from '../api/types';
import { providerCodeLabel } from '../api/constants';

function isFinancialGrouped(data: unknown): data is FinancialComparisonGroupedResponse {
  return typeof data === 'object' && data !== null && 'data' in data;
}

interface RecentSalesProps {
  filters?: import('../api/types').OverviewFilters;
}

export function RecentSales({ filters }: RecentSalesProps) {
  const { data, isLoading, error } = useQuery(
    financialComparisonQueryOptions({ ...filters, groupBy: 'provider' })
  );

  const rows = isFinancialGrouped(data) ? data.data : [];
  const totals = isFinancialGrouped(data)
    ? data.totals
    : { costPrice: 0, totalRevenue: 0, profit: 0, profitMarginPercent: 0, plansSold: 0 };

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Lợi nhuận theo provider</CardTitle>
        <CardDescription>
          Margin {formatPercent(totals.profitMarginPercent)} · Lợi nhuận {formatVnd(totals.profit)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className='text-destructive text-sm'>
            Không thể tải dữ liệu lợi nhuận: {error.message}
          </p>
        ) : null}
        {!error && isLoading ? (
          <p className='text-muted-foreground text-sm'>Đang tải dữ liệu...</p>
        ) : null}
        {!error && !isLoading && rows.length === 0 ? (
          <p className='text-muted-foreground text-sm'>Chưa có dữ liệu tài chính.</p>
        ) : null}
        <div className='space-y-5'>
          {rows.map((row) => (
            <div key={row.group} className='space-y-2'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <p className='text-sm leading-none font-medium'>{providerCodeLabel(row.group)}</p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    Giá vốn {formatVnd(row.costPrice)} · Doanh thu {formatVnd(row.totalRevenue)} ·{' '}
                    {formatNumber(row.plansSold)} plan
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-medium'>{formatVnd(row.profit)}</p>
                  <p className='text-muted-foreground text-xs'>
                    {formatPercent(row.profitMarginPercent)} margin
                  </p>
                </div>
              </div>
              <div className='bg-muted h-2 overflow-hidden rounded-full'>
                <div
                  className='bg-primary h-full rounded-full'
                  style={{
                    width: `${Math.min(Math.max(row.profitMarginPercent, 0), 100)}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        {rows.length > 0 ? (
          <div className='text-muted-foreground mt-6 grid grid-cols-3 gap-2 border-t pt-4 text-xs'>
            <div>
              <div>Giá vốn</div>
              <div className='text-foreground font-medium'>{formatVnd(totals.costPrice)}</div>
            </div>
            <div>
              <div>Doanh thu</div>
              <div className='text-foreground font-medium'>{formatVnd(totals.totalRevenue)}</div>
            </div>
            <div>
              <div>Plan đã bán</div>
              {/* Was `rows.length` — the number of provider rows, always 7,
                  so it never moved after a refund (#009). */}
              <div className='text-foreground font-medium'>{formatNumber(totals.plansSold)}</div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
