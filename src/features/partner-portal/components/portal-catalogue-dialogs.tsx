'use client';

/**
 * "Xem chi tiết" and "Thêm giỏ hàng" of the price list (doitac-1410 #034).
 */

import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDataSize, formatVnd } from '@/lib/format';

import type { CataloguePlan } from '../api/types';
import { addToCart } from '../lib/partner-cart';
import { PriceVndUsd } from './price-vnd-usd';

export const PLAN_TYPE_LABEL: Record<string, string> = {
  fixed: 'Cố định',
  daily: 'Theo ngày',
  unlimited: 'Không giới hạn',
  'unlimited-reduce': 'Không giới hạn giảm tốc'
};

export const yesNo = (value: boolean | undefined) => (value ? 'Có' : 'Không');

/** "Calendar day, UTC+8" / "24h from install" — when high-speed data comes back. */
export function resetLabel(plan: CataloguePlan): string {
  if (plan.dailyResetPolicy === 'calendar_day') {
    const offset = plan.dailyResetUtcOffset ?? 0;
    return `23:59 mỗi ngày theo giờ UTC${offset >= 0 ? '+' : ''}${offset}`;
  }
  if (plan.dailyResetPolicy === 'rolling_24h') return 'Mỗi 24 giờ kể từ khi kích hoạt';
  return plan.type === 'daily'
    ? 'Nhà cung cấp chưa công bố'
    : 'Không áp dụng (gói không theo ngày)';
}

function exitIpLabel(plan: CataloguePlan): string {
  if (plan.ipExport) return plan.ipExport;
  if (plan.isNonHkIp) return 'IP nội địa (không qua Hồng Kông)';
  return '—';
}

/** "Xem chi tiết" — everything in the row, plus the reconciliation details. */
export function PlanDetailDialog({
  plan,
  onOpenChange
}: {
  plan: CataloguePlan | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!plan) return null;
  const rows: [string, React.ReactNode][] = [
    [
      'Mã gói cước',
      <span key='slug' className='font-mono text-xs break-all'>
        {plan.slug}
      </span>
    ],
    ['Điểm đến', plan.destinationName ?? '—'],
    ['Dữ liệu', formatDataSize(plan.dataMb)],
    ['Thời hạn', `${plan.durationDays} ngày`],
    ['Loại gói', PLAN_TYPE_LABEL[plan.type ?? ''] ?? plan.type ?? '—'],
    ['Tốc độ sau giảm tốc', plan.throttleSpeed || '—'],
    ['Tốc độ mạng', plan.speed || '—'],
    ['Nhà mạng', plan.operatorName || '—'],
    [
      'Gọi / SMS',
      plan.hasCallSms ? `Có · Gọi: ${plan.call ?? 0} phút · SMS: ${plan.sms ?? 0}` : 'Không'
    ],
    ['Topup (nạp thêm)', yesNo(plan.topUp)],
    ['Tiktok & AI', yesNo(plan.tiktokAi)],
    ['Hoàn tiền', yesNo(plan.refundable)],
    ['Rẻ nhất', yesNo(plan.isCheapest)],
    ['APN', plan.apn || '—'],
    ['IP thoát mạng', exitIpLabel(plan)],
    ['Reset dung lượng tốc độ cao', resetLabel(plan)],
    ['Giá đại lý', <PriceVndUsd key='unit' vnd={plan.unitPriceVnd} usd={plan.unitPriceUsd} />],
    [
      'Giá bán lẻ đề xuất',
      <PriceVndUsd key='retail' vnd={plan.suggestedRetailVnd ?? 0} usd={plan.suggestedRetailUsd} />
    ]
  ];
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[560px]' data-testid='plan-detail-dialog'>
        <DialogHeader>
          <DialogTitle>{plan.name}</DialogTitle>
          <DialogDescription>Thông tin chi tiết gói eSIM.</DialogDescription>
        </DialogHeader>
        <dl className='divide-y text-sm'>
          {rows.map(([label, value]) => (
            <div key={label} className='flex justify-between gap-4 py-1.5'>
              <dt className='text-muted-foreground shrink-0'>{label}</dt>
              <dd className='text-right'>{value}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

/** "Thêm giỏ hàng" — pick a quantity, add, keep browsing. */
export function AddToCartDialog({
  plan,
  onOpenChange
}: {
  plan: CataloguePlan | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [quantity, setQuantity] = useState('1');
  const [daysText, setDaysText] = useState('1');
  if (!plan) return null;
  const qty = Number(quantity);
  // A day pass is bought for the days the customer needs (vande #014).
  const multiday = !!plan.isAbleMultidate;
  const days = multiday ? Number(daysText) : 1;
  const daysValid = !multiday || (Number.isInteger(days) && days >= 1 && days <= 365);
  const valid = Number.isInteger(qty) && qty > 0 && daysValid;
  // An estimate; the cart is priced again by the server before paying.
  const unitVnd = Math.round((plan.unitPriceVnd * (multiday ? days : 1)) / 1000) * 1000;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          setQuantity('1');
          setDaysText('1');
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className='sm:max-w-md' data-testid='add-to-cart-dialog'>
        <DialogHeader>
          <DialogTitle>Thêm vào giỏ hàng</DialogTitle>
          <DialogDescription>{plan.name}</DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          {multiday && (
            <>
              <Label htmlFor='cart-days'>Số ngày dùng (1–365)</Label>
              <Input
                id='cart-days'
                type='number'
                min={1}
                max={365}
                step={1}
                value={daysText}
                onChange={(e) => setDaysText(e.target.value)}
                data-testid='cart-days'
              />
              {!daysValid && <p className='text-destructive text-xs'>Số ngày phải từ 1 đến 365.</p>}
            </>
          )}
          <Label htmlFor='cart-quantity'>Số lượng eSIM</Label>
          <Input
            id='cart-quantity'
            type='number'
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <p className='text-muted-foreground text-xs'>
            Giá đại lý {formatVnd(multiday && valid ? unitVnd : plan.unitPriceVnd)} / eSIM
            {multiday && valid && days > 1
              ? ` (${days} ngày, ước tính — giỏ hàng tính lại chính xác)`
              : multiday
                ? ' / ngày'
                : ''}
            {valid && (
              <>
                {' '}
                · Thành tiền <Badge variant='outline'>{formatVnd(unitVnd * qty)}</Badge>
              </>
            )}
          </p>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              addToCart({
                planId: plan.id,
                name: multiday && days > 1 ? `${plan.name} — ${days} ngày` : plan.name,
                destinationName: plan.destinationName,
                unitPriceVnd: unitVnd,
                quantity: qty,
                ...(multiday && days > 1 ? { periodNum: days } : {})
              });
              toast.success(`Đã thêm ${qty} eSIM "${plan.name}" vào giỏ hàng.`);
              setQuantity('1');
              setDaysText('1');
              onOpenChange(false);
            }}
          >
            Thêm vào giỏ hàng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
