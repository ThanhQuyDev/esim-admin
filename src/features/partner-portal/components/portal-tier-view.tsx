'use client';

/**
 * Partner tier: where the partner stands, what each tier gives, and the history
 * of past evaluations. Tiers come from the API — nothing about them is
 * hard-coded here.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { formatDateVn, formatVnd, formatDateTimeVn } from '@/lib/format';

import {
  myTierEvaluationsQueryOptions,
  myTiersQueryOptions,
  mySummaryQueryOptions
} from '../api/queries';

export function PortalTierView() {
  const { data: summary } = useQuery(mySummaryQueryOptions());
  const { data: tiers } = useQuery(myTiersQueryOptions());
  const { data: evaluations } = useQuery(myTierEvaluationsQueryOptions());

  const sorted = useMemo(
    () => [...(tiers ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [tiers]
  );

  const current = summary?.tier.current;
  const next = summary?.tier.next;
  const progress = Math.max(0, Math.min(100, Math.round(summary?.tier.progressPercent ?? 0)));

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card className='@container/card'>
          <CardHeader>
            <CardDescription>Hạng hiện tại</CardDescription>
            <CardTitle className='text-3xl font-semibold'>
              {current ? current.tierName : 'Chưa gán hạng'}
            </CardTitle>
            <CardAction>
              <Badge variant='outline'>
                <Icons.award />
                {current ? `Hoa hồng ${Number(current.commissionPercent)}%` : 'Chưa áp dụng'}
              </Badge>
            </CardAction>
            {current && summary?.tier.effectiveFrom && (
              <p className='text-muted-foreground text-xs'>
                Áp dụng từ {formatDateTimeVn(summary.tier.effectiveFrom)}. Đơn phát sinh trước thời
                điểm này vẫn giữ mức hoa hồng của hạng cũ — hệ thống không tính hồi tố.
              </p>
            )}
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>
                  {next ? `Tiến độ lên hạng ${next.tierName}` : 'Đã ở hạng cao nhất'}
                </span>
                <span className='font-medium tabular-nums'>{progress}%</span>
              </div>
              <div className='bg-muted h-2 overflow-hidden rounded-full'>
                <div
                  className='bg-primary h-full rounded-full transition-[width] duration-500'
                  style={{ width: `${progress}%` }}
                />
              </div>
              {next && (
                <p className='text-muted-foreground text-xs'>
                  Còn {formatVnd(summary?.tier.toNextTierVnd)} doanh số hợp lệ.
                </p>
              )}
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button asChild size='sm' variant='outline'>
                <Link href='/dashboard/portal/tier-rules'>Xem quy định xét hạng</Link>
              </Button>
              <Button asChild size='sm' variant='outline'>
                <Link href='/dashboard/portal/commissions'>Xem hoa hồng</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dữ liệu tính hạng</CardTitle>
            <CardDescription>Tính từ các đơn hợp lệ đã qua thời gian xác minh.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {[
              ['Doanh số tích luỹ', formatVnd(summary?.lifetime.revenueVnd)],
              ['Đơn hợp lệ 30 ngày', (summary?.performance.orders ?? 0).toLocaleString('vi-VN')],
              ['Hoa hồng đã ghi nhận', formatVnd(summary?.lifetime.commissionVnd)],
              ['Ngưỡng hạng hiện tại', current ? formatVnd(Number(current.minVolumeVnd)) : '—']
            ].map(([label, value]) => (
              <div key={label} className='flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4'>
                <span className='text-muted-foreground w-44 shrink-0 text-sm font-medium'>
                  {label}
                </span>
                <span className='text-sm tabular-nums'>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quyền lợi theo hạng</CardTitle>
          <CardDescription>
            Quyền lợi áp dụng từ kỳ kế tiếp sau khi kết quả đánh giá được khoá.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {sorted.map((t) => {
              const isCurrent = t.tierCode === current?.tierCode;
              return (
                <div
                  key={t.id}
                  className={cn(
                    'rounded-lg border p-4 transition-colors',
                    isCurrent && 'border-primary bg-primary/5'
                  )}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <p className='font-medium'>{t.tierName}</p>
                    {isCurrent && <Badge>Hạng của bạn</Badge>}
                  </div>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {Number(t.minVolumeVnd) > 0
                      ? `Từ ${formatVnd(Number(t.minVolumeVnd))} doanh số`
                      : 'Mặc định khi được duyệt'}
                  </p>
                  <div className='mt-3 space-y-1 text-xs'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>Hoa hồng</span>
                      <span className='font-medium tabular-nums'>
                        {Number(t.commissionPercent)}%
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>Giảm tối đa</span>
                      <span className='font-medium tabular-nums'>
                        {Number(t.maxDiscountPercent)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <p className='text-muted-foreground col-span-full py-8 text-center text-sm'>
                Chưa có cấu hình hạng nào.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Lịch sử đánh giá hạng
            <Badge variant='outline'>{(evaluations ?? []).length} kỳ</Badge>
          </CardTitle>
          <CardDescription>Hạng được cập nhật dựa trên dữ liệu đã xác nhận.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Kỳ đánh giá</TableHead>
                  <TableHead>Hạng trước</TableHead>
                  <TableHead>Hạng sau</TableHead>
                  <TableHead className='text-right'>Đơn hợp lệ</TableHead>
                  <TableHead className='text-right'>Doanh số</TableHead>
                  <TableHead>Kết quả</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(evaluations ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className='h-24 text-center'>
                      <p className='text-muted-foreground text-sm'>Chưa có kỳ đánh giá nào.</p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Kỳ đầu tiên được chốt vào cuối tháng sau khi tài khoản được duyệt.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
                {(evaluations ?? []).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className='whitespace-nowrap'>
                      {formatDateVn(e.evaluatedAt)}
                    </TableCell>
                    <TableCell>{e.tierBefore ?? '—'}</TableCell>
                    <TableCell className='font-medium'>{e.tierAfter ?? '—'}</TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {e.validOrders.toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {formatVnd(Number(e.revenueVnd))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.result === 'promoted' ? 'default' : 'secondary'}>
                        {e.result === 'promoted' ? 'Nâng hạng' : 'Duy trì hạng'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
