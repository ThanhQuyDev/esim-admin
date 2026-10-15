'use client';

/**
 * One attributed order, opened from the list (#026).
 *
 * The timeline is the point: a partner querying a commission wants to see when
 * the customer touched their link, when the order was placed, when the eSIM
 * started working, and when the money was approved — or taken back.
 */

import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';

import { myOrderDetailQueryOptions } from '../api/queries';
import { COMMISSION_STATUS, ProductLine, refundedQtyOf } from './orders-table/columns';

function formatMoment(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

interface OrderDetailDialogProps {
  orderNumber: string | null;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({ orderNumber, onOpenChange }: OrderDetailDialogProps) {
  const { data, isLoading } = useQuery(myOrderDetailQueryOptions(orderNumber));

  const status = data?.commissionStatus ? COMMISSION_STATUS[data.commissionStatus] : null;

  // How many eSIMs came back, for the header (doitac-1410 #020).
  const totalEsims = data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const refundedEsims = data?.items.reduce((sum, item) => sum + refundedQtyOf(item), 0) ?? 0;

  const steps = [
    {
      label:
        data?.source.type === 'coupon' ? 'Khách nhập mã giới thiệu' : 'Khách bấm link giới thiệu',
      at:
        data?.timeline.clickedAt ??
        (data?.source.type === 'coupon' ? data?.timeline.placedAt : null),
      hint: data?.source.code ?? undefined
    },
    { label: 'Đặt hàng thành công', at: data?.timeline.placedAt ?? null },
    {
      label: 'eSIM được kích hoạt',
      at: data?.timeline.activatedAt ?? null,
      hint: data?.timeline.activatedAt ? undefined : 'Khách chưa kích hoạt'
    },
    {
      label: 'Hoa hồng được duyệt',
      at: data?.timeline.creditedAt ?? null,
      hint: data?.timeline.creditedAt ? undefined : 'Duyệt sau 24h kể từ khi đặt hàng'
    },
    // Every refund, with how many eSIMs and when (doitac-1410 #020).
    ...(data?.refunds ?? []).map((refund, index) => ({
      label:
        refund.esimCount != null && refund.esimCount > 0
          ? `Khách hoàn ${refund.esimCount} eSIM`
          : 'Khách được hoàn tiền',
      at: refund.at,
      hint: `-${formatVnd(refund.amountVnd)}`,
      key: `refund-${index}`
    })),
    ...(data?.timeline.reversedAt
      ? [{ label: 'Chuyển sang đơn hoàn tiền', at: data.timeline.reversedAt }]
      : [])
  ];

  return (
    <Dialog open={Boolean(orderNumber)} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Chi tiết đơn {orderNumber}</DialogTitle>
          <DialogDescription>
            Sản phẩm, hoa hồng và lịch sử ghi nhận nguồn giới thiệu của đơn này.
          </DialogDescription>
          {refundedEsims > 0 && (
            <Badge variant='secondary' className='w-fit' data-testid='order-refunded-esims'>
              {refundedEsims >= totalEsims
                ? `Đã hoàn tiền toàn bộ ${totalEsims} eSIM`
                : `Đã hoàn ${refundedEsims}/${totalEsims} eSIM`}
            </Badge>
          )}
        </DialogHeader>

        {isLoading && <p className='text-muted-foreground py-8 text-center text-sm'>Đang tải…</p>}

        {data && (
          <div className='space-y-4'>
            <div className='space-y-1'>
              {data.items.map((item, index) => (
                <ProductLine key={`${item.planName}-${index}`} item={item} wrap />
              ))}
            </div>

            <Separator />

            <dl className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <dt className='text-muted-foreground'>Tổng doanh thu đơn</dt>
                <dd className='font-medium tabular-nums'>{formatVnd(data.revenueVnd)}</dd>
                {data.refundedVnd > 0 && (
                  <dd className='text-muted-foreground text-xs tabular-nums'>
                    Đã hoàn {formatVnd(data.refundedVnd)} · còn{' '}
                    {formatVnd(Math.max(0, data.revenueVnd - data.refundedVnd))}
                  </dd>
                )}
              </div>
              <div>
                <dt className='text-muted-foreground'>Hoa hồng</dt>
                <dd className='font-medium tabular-nums'>
                  {data.commissionVnd == null ? '—' : formatVnd(data.commissionVnd)}
                  {data.commissionPercent != null && (
                    <span className='text-muted-foreground font-normal'>
                      {' '}
                      ({data.commissionPercent}%)
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Trạng thái đơn</dt>
                <dd>
                  {status ? (
                    <Badge variant='outline' className={status.className}>
                      {status.label}
                    </Badge>
                  ) : (
                    <span className='text-muted-foreground'>Không phát sinh hoa hồng</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Nguồn ghi nhận</dt>
                <dd className='font-mono text-xs'>
                  {data.source.type === 'link'
                    ? `/go/${data.source.code}`
                    : (data.source.code ?? '—')}
                </dd>
              </div>
            </dl>

            <Separator />

            <div>
              <p className='mb-3 text-sm font-medium'>Lịch sử ghi nhận nguồn giới thiệu</p>
              <ol className='space-y-3'>
                {steps.map((step) => (
                  <li
                    key={'key' in step && step.key ? step.key : step.label}
                    className='flex gap-3'
                  >
                    <span
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        step.at ? 'bg-primary' : 'bg-muted-foreground/30'
                      )}
                    />
                    <div className='min-w-0'>
                      <p className='text-sm'>{step.label}</p>
                      <p className='text-muted-foreground text-xs'>
                        {formatMoment(step.at ?? null)}
                        {step.hint && ` · ${step.hint}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
