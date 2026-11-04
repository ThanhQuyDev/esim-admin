'use client';

/**
 * "Xem chi tiết" and "Thêm giỏ hàng" of the price list (doitac-1410 #034).
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { formatDataSize, formatVnd } from '@/lib/format';

import { quoteCart } from '../api/service';
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

/**
 * "Tiktok & AI" (doitac-3010 #026): "Không rõ" when neither the APN table nor
 * the exit IP tells — only China blocks them, so "Không" would mislead.
 */
export function tiktokAiLabel(plan: CataloguePlan): string {
  if (plan.tiktokAi) return 'Có';
  return plan.tiktokAiKnown === false ? 'Không rõ' : 'Không';
}

/** "Chia sẻ kết nối / Hotspot": with its daily allowance when there is one. */
function hotspotLabel(plan: CataloguePlan): string {
  if (plan.hotSpot == null) return 'Không rõ';
  if (!plan.hotSpot) return 'Không';
  const allow = plan.hotSpotAllow?.trim();
  if (!allow) return 'Có';
  // Stored as "1" (GB) or already with its unit, "500MB".
  return `Có (tối đa ${/^\d+(\.\d+)?$/.test(allow) ? `${allow} GB` : allow})`;
}

/** The refundable eSIMs are the roaming ones; the others are local SIMs. */
function roamingLabel(plan: CataloguePlan): string {
  return plan.refundable ? 'Có (eSIM roaming)' : 'Không (SIM nội địa của nước đến)';
}

/** Lower case, without Vietnamese marks, so "nhat ban" finds "Nhật Bản". */
function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
}

/**
 * A region's countries behind an eye and their count, with a search box —
 * as on the admin's plan list (doitac-3010 #026).
 */
export function RegionCountries({ plan }: { plan: CataloguePlan }) {
  const [query, setQuery] = useState('');
  const countries = plan.region?.countries ?? [];
  if (!countries.length) return null;
  const shown = query.trim()
    ? countries.filter((c) => plain(c.name).includes(plain(query.trim())))
    : countries;
  return (
    <Popover onOpenChange={(open) => !open && setQuery('')}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='h-6 px-1.5 text-xs'
          data-testid={`region-countries-${plan.id}`}
        >
          <Icons.eye className='mr-1 size-3' />
          {countries.length} nước
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-64 p-0' align='start'>
        <div className='space-y-2 border-b px-3 py-2'>
          <p className='text-sm font-medium'>{plan.region?.name}</p>
          <p className='text-muted-foreground text-xs'>{countries.length} điểm đến</p>
          <Input
            placeholder='Tìm quốc gia…'
            className='h-8'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid='region-countries-search'
          />
        </div>
        <div className='max-h-60 overflow-y-auto p-2'>
          {shown.length === 0 ? (
            <p className='text-muted-foreground px-2 py-1 text-xs'>Không có quốc gia này.</p>
          ) : (
            <div className='grid gap-1'>
              {shown.map((c) => (
                <div key={c.name} className='flex items-center gap-2 rounded px-2 py-1'>
                  {c.flagUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.flagUrl}
                      alt={c.name}
                      className='h-4 w-5 shrink-0 rounded object-cover'
                    />
                  )}
                  <span className='text-sm'>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** A country's flag, or a region's picture, before its name (doitac-3010 #026). */
export function DestinationLabel({ plan, compact }: { plan: CataloguePlan; compact?: boolean }) {
  const picture = plan.region ? plan.region.avatarUrl : plan.destinationFlagUrl;
  return (
    <span className='inline-flex flex-wrap items-center gap-1.5'>
      {picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={picture}
          alt=''
          className={compact ? 'h-4 w-5 rounded object-cover' : 'h-5 w-7 rounded object-cover'}
        />
      ) : plan.region ? (
        <Icons.global className='size-4 opacity-70' />
      ) : null}
      <span>{plan.destinationName ?? '—'}</span>
      <RegionCountries plan={plan} />
    </span>
  );
}

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
    ['Điểm đến', <DestinationLabel key='dest' plan={plan} />],
    ['Thời hạn', `${plan.durationDays} ngày`],
    ['Dữ liệu', formatDataSize(plan.dataMb)],
    ['Loại gói', PLAN_TYPE_LABEL[plan.type ?? ''] ?? plan.type ?? '—'],
    ['Sau giảm tốc', plan.throttleSpeed || '—'],
    ['Tốc độ mạng', plan.speed || '—'],
    ['Nhà mạng', plan.operatorName || '—'],
    [
      'Gọi / SMS',
      plan.hasCallSms ? `Có · Gọi: ${plan.call ?? 0} phút · SMS: ${plan.sms ?? 0}` : 'Không'
    ],
    ['Topup (nạp thêm)', yesNo(plan.topUp)],
    ['Tiktok & AI', tiktokAiLabel(plan)],
    // doitac-3010 #026
    ['eKYC', yesNo(plan.isKyc)],
    ['Chia sẻ kết nối / Hotspot', hotspotLabel(plan)],
    ['Roaming', roamingLabel(plan)],
    ['Hoàn tiền', yesNo(plan.refundable)],
    ['Rẻ nhất', yesNo(plan.isCheapest)],
    ['APN', plan.apn || '—'],
    ['IP thoát mạng', exitIpLabel(plan)],
    ['Reset dung lượng tốc độ cao', resetLabel(plan)],
    ['Giá đại lý', <PriceVndUsd key='unit' vnd={plan.unitPriceVnd} usd={plan.unitPriceUsd} />],
    [
      'Giá bán lẻ',
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
  const qty = Number(quantity);
  // A day pass is bought for the days the customer needs (vande #014).
  const multiday = !!plan?.isAbleMultidate;
  const days = multiday ? Number(daysText) : 1;
  const daysValid = !multiday || (Number.isInteger(days) && days >= 1 && days <= 365);
  const valid = Number.isInteger(qty) && qty > 0 && daysValid;
  // Several days are priced by the server on their whole cost: the 1-day agent
  // price × days is not what the partner pays (vande-0411 #002).
  const needsQuote = !!plan && multiday && daysValid && days > 1;
  const { data: dayQuote, isFetching: quoting } = useQuery({
    queryKey: ['partner-portal', 'day-pass-quote', plan?.id, days],
    queryFn: () => quoteCart([{ planId: plan!.id, quantity: 1, periodNum: days }]),
    enabled: needsQuote
  });
  if (!plan) return null;
  const unitVnd = needsQuote ? (dayQuote?.lines[0]?.unitPriceVnd ?? 0) : plan.unitPriceVnd;
  const priced = !needsQuote || unitVnd > 0;

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
            Giá đại lý {needsQuote && !priced ? '…' : formatVnd(unitVnd)} / eSIM
            {needsQuote ? ` (${days} ngày)` : multiday ? ' / ngày' : ''}
            {valid && priced && (
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
            disabled={!valid || !priced || quoting}
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
