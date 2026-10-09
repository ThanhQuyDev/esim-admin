'use client';

/**
 * How a partner has been doing, last 30 days (#061).
 *
 * Two different tables because the two programmes are two businesses. A
 * marketing partner is judged link by link — clicks, orders, commission and how
 * many came back — and an admin can create another link for them here, which is
 * what a VIP asking for a memorable code needs. A distribution partner has no
 * links: what matters is what they bought at their own price, across eSIMs and
 * top-ups together, and the same refund rate.
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import { adminCreateLinkForPartnerMutation } from '../api/mutations';
import { partnerPerformanceQueryOptions } from '../api/queries';

/** The path part of what the admin pasted: a full esim.vn link or a path. */
function landingPath(input: string): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed, 'https://esim.vn');
    return `${url.pathname}${url.search}`;
  } catch {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
}

/** A refund rate worth an admin's eye rather than a number to scroll past. */
function RefundRate({ percent }: { percent: number }) {
  if (percent <= 0) return <span className='text-muted-foreground'>0%</span>;
  return (
    <span className={percent >= 20 ? 'text-destructive font-medium' : undefined}>{percent}%</span>
  );
}

export function PartnerPerformanceCard({ partnerId }: { partnerId: number }) {
  const { data, isLoading, refetch } = useQuery(partnerPerformanceQueryOptions(partnerId));
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  // Product page the link opens (#014, test round 4) — it only ever went to
  // the home page. A full esim.vn link or a path; only the path is stored.
  const [landing, setLanding] = useState('');

  const createLink = useMutation({
    ...adminCreateLinkForPartnerMutation,
    onSuccess: () => {
      toast.success('Đã tạo link tiếp thị cho đối tác.');
      setCode('');
      setLabel('');
      setLanding('');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Tạo link thất bại')
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className='flex justify-center py-12'>
          <Icons.spinner className='size-6 animate-spin' />
        </CardContent>
      </Card>
    );
  }

  if (data.distribution) {
    const d = data.distribution;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động 30 ngày</CardTitle>
          <CardDescription>
            Doanh thu tính theo giá đối tác đã mua, không phải giá niêm yết của esim.vn. Số đơn gộp
            cả eSIM và nạp thêm dung lượng.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='rounded-lg border p-4'>
            <p className='text-muted-foreground text-xs'>Tổng doanh thu</p>
            <p className='mt-1 text-xl font-semibold tabular-nums'>{formatVnd(d.revenueVnd)}</p>
          </div>
          <div className='rounded-lg border p-4'>
            <p className='text-muted-foreground text-xs'>Đơn thành công</p>
            <p className='mt-1 text-xl font-semibold tabular-nums'>{d.orders}</p>
          </div>
          <div className='rounded-lg border p-4'>
            <p className='text-muted-foreground text-xs'>Đơn hoàn</p>
            <p className='mt-1 text-xl font-semibold tabular-nums'>{d.refundedOrders}</p>
          </div>
          <div className='rounded-lg border p-4'>
            <p className='text-muted-foreground text-xs'>Tỷ lệ đơn hoàn</p>
            <p className='mt-1 text-xl font-semibold tabular-nums'>
              <RefundRate percent={d.refundRatePercent} />
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link & mã giới thiệu · 30 ngày</CardTitle>
        <CardDescription>
          Hiệu quả từng link và mã của đối tác. Admin có thể tạo thêm link giúp đối tác, không giới
          hạn — thường dùng cho đối tác VIP cần mã dễ nhớ.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap items-end gap-2'>
          <Input
            className='max-w-[200px]'
            placeholder='Mã link (để trống: tự sinh)'
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Input
            className='max-w-[240px]'
            placeholder='Tên link (VD: Video Nhật Bản T8)'
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Input
            className='min-w-[260px] flex-1'
            placeholder='Đường dẫn sản phẩm (VD: https://esim.vn/esim-nhat-ban) — để trống: trang chủ'
            value={landing}
            onChange={(e) => setLanding(e.target.value)}
            aria-label='Đường dẫn sản phẩm'
          />
          <Button
            size='sm'
            isLoading={createLink.isPending}
            onClick={() =>
              createLink.mutate({
                id: partnerId,
                data: {
                  ...(code.trim() && { code: code.trim() }),
                  ...(label.trim() && { label: label.trim() }),
                  ...(landingPath(landing) && { targetPath: landingPath(landing) })
                }
              })
            }
          >
            <Icons.add className='mr-2 size-4' /> Tạo link giúp đối tác
          </Button>
        </div>

        {data.links.length === 0 ? (
          <p className='text-muted-foreground py-8 text-center text-sm'>
            Đối tác chưa có link tiếp thị nào.
          </p>
        ) : (
          <div className='overflow-x-auto rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Link</TableHead>
                  <TableHead className='text-right'>Lượt xem</TableHead>
                  <TableHead className='text-right'>Đơn thành công</TableHead>
                  <TableHead className='text-right'>Hoa hồng</TableHead>
                  <TableHead className='text-right'>Đơn hoàn</TableHead>
                  <TableHead className='text-right'>Tỷ lệ hoàn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='font-mono text-xs'>{link.code}</span>
                        {link.label && (
                          <span className='text-muted-foreground text-xs'>{link.label}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>{link.clicks}</TableCell>
                    <TableCell className='text-right tabular-nums'>{link.orders}</TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {formatVnd(link.commissionVnd)}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>{link.refundedOrders}</TableCell>
                    <TableCell className='text-right tabular-nums'>
                      <RefundRate percent={link.refundRatePercent} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {data.coupons.length > 0 && (
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Mã giảm giá</p>
            <div className='overflow-x-auto rounded-lg border'>
              <Table>
                <TableHeader className='bg-muted'>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead className='text-right'>Đơn thành công</TableHead>
                    <TableHead className='text-right'>Hoa hồng</TableHead>
                    <TableHead className='text-right'>Đơn hoàn</TableHead>
                    <TableHead className='text-right'>Tỷ lệ hoàn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.coupons.map((coupon) => (
                    <TableRow key={coupon.code}>
                      <TableCell>
                        <Badge variant='outline'>{coupon.code}</Badge>
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>{coupon.orders}</TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {formatVnd(coupon.commissionVnd)}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {coupon.refundedOrders}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        <RefundRate percent={coupon.refundRatePercent} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
