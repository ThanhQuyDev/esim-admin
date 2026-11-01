'use client';

/**
 * Section 4 of the partner page (doitac-1410 #004): the figures the partner
 * sees on their own dashboard, over a period the admin picks.
 *
 * 4.1 is the marketing side — commission pending, earned and withdrawable,
 * plus the orders, refunds and refund share the partner's dashboard leaves
 * out. 4.2 is "Hiệu suất hoạt động" for a distribution partner — what they
 * bought, cancelled and spent, eSIMs and top-ups apart. A distribution partner
 * who also runs the programme gets both.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { DateRangeFilter } from '@/components/date-range-filter';
import { DATE_PRESETS, type DatePreset, resolveDatePreset } from '@/lib/date-presets';
import { formatVnd } from '@/lib/format';

import { partnerStatsQueryOptions } from '../api/queries';
import type { Partner } from '../api/types';

type Preset = DatePreset | 'thisMonth' | 'sinceCreated';

/** The shared presets (doitac-3010 #031), plus this partner's own two. */
const PRESETS: { value: Preset; label: string }[] = [
  ...DATE_PRESETS,
  { value: 'thisMonth', label: 'Tháng này' },
  { value: 'sinceCreated', label: 'Từ khi tạo' }
];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Day bounds for a preset, on the admin's own clock — "Hôm nay" in Hanoi is
 * not "today" in UTC. The server takes them as inclusive days.
 */
function presetRange(preset: Preset, createdAt: string): { from: string; to: string } {
  const today = new Date();
  if (preset === 'thisMonth') {
    return { from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today) };
  }
  if (preset === 'sinceCreated') {
    return { from: iso(new Date(createdAt)), to: iso(today) };
  }
  return resolveDatePreset(preset, today);
}

function Stat({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'danger';
}) {
  return (
    <div className='rounded-lg border p-4'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p
        className={`mt-1 text-xl font-semibold tabular-nums ${tone === 'danger' ? 'text-destructive' : ''}`}
      >
        {value}
      </p>
      {hint && <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>}
    </div>
  );
}

const count = (n: number | undefined) => (n ?? 0).toLocaleString('vi-VN');

export function PartnerStatsSection({ partner }: { partner: Partner }) {
  const [preset, setPreset] = useState<Preset | null>('last30days');
  const [custom, setCustom] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const range = useMemo(
    () =>
      preset
        ? presetRange(preset, partner.createdAt)
        : { from: custom.from, to: custom.to || custom.from },
    [preset, custom, partner.createdAt]
  );

  const { data, isLoading, isError } = useQuery({
    ...partnerStatsQueryOptions(partner.id, range),
    enabled: Boolean(range.from)
  });

  const isKol = partner.partnerType === 'kol';
  // A distribution partner who runs the programme gets both cards: 4.1, 4.2.
  const both = !isKol && Boolean(partner.canAffiliate);
  const m = data?.marketing;
  const d = data?.distribution;

  const filter = (
    <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
      <Tabs
        value={preset ?? ''}
        onValueChange={(value) => {
          setPreset(value as Preset);
          setCustom({ from: '', to: '' });
        }}
      >
        <TabsList className='h-auto flex-wrap'>
          {PRESETS.map((p) => (
            <TabsTrigger key={p.value} value={p.value}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {/* The calendar by ngày / tuần / tháng / năm (doitac-3010 #031). */}
      <DateRangeFilter
        label='Chọn theo lịch'
        placeholder='Chưa chọn'
        from={preset ? undefined : custom.from || undefined}
        to={preset ? undefined : custom.to || undefined}
        onChange={(picked) => {
          if (!picked.from) {
            setPreset('last30days');
            setCustom({ from: '', to: '' });
            return;
          }
          setPreset(null);
          setCustom({ from: picked.from, to: picked.to ?? picked.from });
        }}
        testId='partner-stats-date'
      />
    </div>
  );

  const body = (content: React.ReactNode) =>
    isLoading ? (
      <div className='flex justify-center py-10'>
        <Icons.spinner className='size-6 animate-spin' />
      </div>
    ) : isError ? (
      <p className='text-destructive py-6 text-center text-sm'>Không tải được số liệu.</p>
    ) : (
      content
    );

  return (
    <div className='space-y-4' data-testid='partner-stats'>
      {(isKol || partner.canAffiliate) && (
        <Card>
          <CardHeader>
            <CardTitle>{both ? '4.1' : '4.'} Thống kê tiếp thị liên kết</CardTitle>
            <CardDescription>
              Cùng số liệu với trang tổng quan của đối tác, cộng thêm đơn hoàn và tỷ lệ hoàn.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {filter}
            {body(
              m && (
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  <Stat
                    label='Hoa hồng chờ duyệt'
                    value={formatVnd(m.commissionPendingVnd)}
                    hint='Tất cả đơn đang chờ đối soát'
                  />
                  <Stat
                    label='Tổng hoa hồng'
                    value={formatVnd(m.performance.commissionVnd)}
                    hint={`${formatVnd(m.lifetime.commissionVnd)} từ trước tới nay`}
                  />
                  <Stat
                    label='Số tiền khả dụng rút'
                    value={formatVnd(m.wallet.availableBalanceVnd)}
                    hint={m.wallet.status === 'locked' ? 'Ví đang bị đóng băng' : 'Hiện tại'}
                    tone={m.wallet.status === 'locked' ? 'danger' : undefined}
                  />
                  <Stat label='Doanh số' value={formatVnd(m.performance.revenueVnd)} />
                  <Stat label='Lượt nhấp' value={count(m.performance.clicks)} />
                  <Stat label='Tổng đơn hàng' value={count(m.performance.orders)} />
                  <Stat label='Tổng đơn hàng hoàn' value={count(m.refundedOrders)} />
                  <Stat
                    label='Tỷ lệ đơn hoàn'
                    value={`${m.refundRatePercent.toLocaleString('vi-VN')}%`}
                    tone={m.refundRatePercent >= 20 ? 'danger' : undefined}
                  />
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {!isKol && (
        <Card>
          <CardHeader>
            <CardTitle>{both ? '4.2' : '4.'} Hiệu suất hoạt động</CardTitle>
            <CardDescription>
              Cùng số liệu với trang tổng quan của đối tác phân phối. Doanh thu tính theo giá đối
              tác đã mua, không phải giá niêm yết của esim.vn.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* One filter drives both cards; repeating it here would let them disagree. */}
            {both ? null : filter}
            {body(
              d && (
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  <Stat
                    label='Tổng đơn hàng'
                    value={count(d.total.orders)}
                    hint='eSIM và nạp thêm dung lượng'
                  />
                  <Stat label='Đã huỷ' value={count(d.total.cancelledOrders)} />
                  <Stat label='Đã chi' value={formatVnd(d.total.revenueVnd)} />
                  <Stat
                    label='Số dư ký quỹ'
                    value={formatVnd(data?.wallet.balanceVnd)}
                    hint={data?.wallet.status === 'locked' ? 'Ví đang bị đóng băng' : 'Hiện tại'}
                    tone={data?.wallet.status === 'locked' ? 'danger' : undefined}
                  />
                  <Stat
                    label='Đơn mua eSIM'
                    value={count(d.esim.orders)}
                    hint={`${formatVnd(d.esim.revenueVnd)} · ${count(d.esim.cancelledOrders)} huỷ`}
                  />
                  <Stat
                    label='Đơn nạp thêm dung lượng'
                    value={count(d.topup.orders)}
                    hint={`${formatVnd(d.topup.revenueVnd)} · ${count(d.topup.cancelledOrders)} huỷ`}
                  />
                  <Stat
                    label='eSIM đã kích hoạt'
                    value={count(d.activatedEsims.count)}
                    hint={formatVnd(d.activatedEsims.revenueVnd)}
                  />
                  <Stat
                    label='Tỷ lệ đơn huỷ'
                    value={`${
                      d.total.orders > 0
                        ? (
                            Math.round((d.total.cancelledOrders / d.total.orders) * 1000) / 10
                          ).toLocaleString('vi-VN')
                        : 0
                    }%`}
                  />
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
