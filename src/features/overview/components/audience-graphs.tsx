'use client';

/**
 * Who comes to the site and who buys (vande #059).
 *
 * Visits and orders are counts of very different size, so they are never put
 * on one axis: each is a 100% bar of its own, split the same way, one above
 * the other — the shares compare directly, and the counts are in the table
 * beside. Hues are fixed per category (the device palette already used on
 * Tổng quan), the numbers stay in text ink.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { formatNumber } from '@/lib/format';
import { overviewAudienceQueryOptions } from '../api/queries';
import type { OverviewFilters } from '../api/types';

/** Light and dark steps, set on the card so bar and legend read the same ones. */
const COLOR_VARS =
  '[--aud-desktop:#2a78d6] [--aud-mobile:#eb6834] [--aud-tablet:#1baf7a] [--aud-unknown:#898781] ' +
  '[--aud-new:#2a78d6] [--aud-returning:#1baf7a] ' +
  'dark:[--aud-desktop:#3987e5] dark:[--aud-mobile:#d95926] dark:[--aud-tablet:#199e70] ' +
  'dark:[--aud-new:#3987e5] dark:[--aud-returning:#199e70]';

type Segment = { key: string; label: string };
type Row = { key: string; visits: number; orders: number };

const pct = (value: number, total: number) => (total ? Math.round((value / total) * 1000) / 10 : 0);

function StackedBar({
  label,
  total,
  unit,
  parts
}: {
  label: string;
  total: number;
  unit: string;
  parts: { key: string; label: string; value: number }[];
}) {
  return (
    <div className='space-y-1.5'>
      <div className='flex justify-between text-xs'>
        <span className='font-medium'>{label}</span>
        <span className='text-muted-foreground tabular-nums'>
          {formatNumber(total)} {unit}
        </span>
      </div>
      {total === 0 ? (
        <div className='bg-muted text-muted-foreground flex h-7 items-center justify-center rounded-md text-xs'>
          Chưa có dữ liệu
        </div>
      ) : (
        // A 2px surface gap between segments; each one names itself on hover.
        <div className='flex h-7 gap-0.5 overflow-hidden rounded-md' role='img' aria-label={label}>
          {parts
            .filter((p) => p.value > 0)
            .map((p) => (
              <div
                key={p.key}
                className='h-full min-w-1 transition-opacity hover:opacity-80'
                style={{
                  width: `${pct(p.value, total)}%`,
                  backgroundColor: `var(--aud-${p.key})`
                }}
                title={`${p.label}: ${formatNumber(p.value)} ${unit} · ${pct(p.value, total)}%`}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function SplitCard({
  title,
  description,
  segments,
  rows,
  footnote,
  testId
}: {
  title: string;
  description: string;
  segments: Segment[];
  rows: Row[];
  footnote?: string;
  testId: string;
}) {
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const shown = segments.filter(
    (s) => s.key !== 'unknown' || (byKey.get(s.key)?.visits ?? 0) + (byKey.get(s.key)?.orders ?? 0)
  );
  const visits = rows.reduce((sum, r) => sum + r.visits, 0);
  const orders = rows.reduce((sum, r) => sum + r.orders, 0);
  const part = (field: 'visits' | 'orders') =>
    shown.map((s) => ({ key: s.key, label: s.label, value: byKey.get(s.key)?.[field] ?? 0 }));

  return (
    <Card className={`h-full ${COLOR_VARS}`} data-testid={testId}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <StackedBar label='Lượt truy cập' unit='lượt' total={visits} parts={part('visits')} />
        <StackedBar label='Đơn hàng thành công' unit='đơn' total={orders} parts={part('orders')} />
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-muted-foreground text-xs'>
              <th className='py-1 text-left font-normal'>Nhóm</th>
              <th className='py-1 text-right font-normal'>Lượt truy cập</th>
              <th className='py-1 text-right font-normal'>Đơn hàng</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((s) => {
              const row = byKey.get(s.key);
              return (
                <tr key={s.key} className='border-t' data-testid={`${testId}-${s.key}`}>
                  <td className='py-1.5'>
                    <span className='flex items-center gap-2'>
                      <span
                        className='size-3 shrink-0 rounded-[3px]'
                        style={{ backgroundColor: `var(--aud-${s.key})` }}
                        aria-hidden='true'
                      />
                      {s.label}
                    </span>
                  </td>
                  <td className='py-1.5 text-right font-mono tabular-nums'>
                    {formatNumber(row?.visits ?? 0)}
                    <span className='text-muted-foreground ml-1 text-xs'>
                      {pct(row?.visits ?? 0, visits)}%
                    </span>
                  </td>
                  <td className='py-1.5 text-right font-mono tabular-nums'>
                    {formatNumber(row?.orders ?? 0)}
                    <span className='text-muted-foreground ml-1 text-xs'>
                      {pct(row?.orders ?? 0, orders)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {footnote && <p className='text-muted-foreground text-xs'>{footnote}</p>}
      </CardContent>
    </Card>
  );
}

const NO_VISITS =
  'Lượt truy cập được ghi nhận từ khi bản cập nhật này chạy trên web (mỗi trình duyệt tối đa 1 lượt/ngày).';

export function AudienceDeviceGraph({ filters }: { filters: OverviewFilters }) {
  const { data } = useQuery(overviewAudienceQueryOptions(filters));
  return (
    <SplitCard
      testId='audience-devices'
      title='Truy cập & đơn hàng theo thiết bị'
      description='Tỷ lệ lượt truy cập và đơn thành công theo loại thiết bị'
      segments={[
        { key: 'desktop', label: 'Máy tính' },
        { key: 'mobile', label: 'Di động' },
        { key: 'tablet', label: 'Máy tính bảng' },
        { key: 'unknown', label: 'Không rõ' }
      ]}
      rows={(data?.devices ?? []).map((d) => ({ key: d.deviceType, ...d }))}
      footnote={`${NO_VISITS} Không rõ: đơn tạo trong CMS hoặc đặt trước khi hệ thống ghi nhận thiết bị.`}
    />
  );
}

export function AudienceCustomerGraph({ filters }: { filters: OverviewFilters }) {
  const { data } = useQuery(overviewAudienceQueryOptions(filters));
  return (
    <SplitCard
      testId='audience-customers'
      title='Khách mới & khách quay lại'
      description='Lượt truy cập và đơn thành công của khách mới / khách quay lại'
      segments={[
        { key: 'new', label: 'Khách mới' },
        { key: 'returning', label: 'Khách quay lại' }
      ]}
      rows={(data?.customers ?? []).map((c) => ({ key: c.kind, ...c }))}
      footnote='Lượt truy cập: mới khi trình duyệt lần đầu vào web. Đơn hàng: mới khi là đơn thanh toán đầu tiên của tài khoản đó.'
    />
  );
}

export function AudienceCountries({ filters }: { filters: OverviewFilters }) {
  const { data, isLoading } = useQuery(overviewAudienceQueryOptions(filters));
  const [open, setOpen] = useState<string | null>(null);
  const countries = data?.countries ?? [];

  return (
    <Card className='h-full' data-testid='audience-countries'>
      <CardHeader>
        <CardTitle>Người dùng theo quốc gia / thành phố</CardTitle>
        <CardDescription>
          Số người truy cập (mỗi trình duyệt tính 1) và % trên tổng
          {data ? ` ${formatNumber(data.totalVisitors)} người` : ''}. Bấm quốc gia để xem thành phố.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='bg-muted h-40 animate-pulse rounded-lg' />
        ) : countries.length === 0 ? (
          <p className='text-muted-foreground py-10 text-center text-sm'>
            Chưa có lượt truy cập nào trong khoảng thời gian này. {NO_VISITS}
          </p>
        ) : (
          <ul className='divide-y'>
            {countries.map((c) => (
              <li key={c.country}>
                <button
                  type='button'
                  className='hover:bg-muted/50 flex w-full items-center gap-3 rounded-md px-1 py-2 text-left text-sm'
                  onClick={() => setOpen(open === c.country ? null : c.country)}
                  aria-expanded={open === c.country}
                  data-testid={`country-${c.country}`}
                >
                  <Icons.chevronRight
                    className={`size-4 shrink-0 transition-transform ${open === c.country ? 'rotate-90' : ''}`}
                    aria-hidden='true'
                  />
                  <span className='w-28 shrink-0 truncate font-medium sm:w-40'>{c.name}</span>
                  <span className='bg-muted h-2 flex-1 overflow-hidden rounded-full'>
                    <span
                      className='block h-full rounded-full bg-[#2a78d6] dark:bg-[#3987e5]'
                      style={{ width: `${c.percent}%` }}
                    />
                  </span>
                  <span className='w-12 text-right font-mono tabular-nums'>
                    {formatNumber(c.visitors)}
                  </span>
                  <span className='text-muted-foreground w-12 text-right font-mono text-xs tabular-nums'>
                    {c.percent}%
                  </span>
                </button>
                {open === c.country && (
                  <ul className='mb-2 ml-7 space-y-1 text-sm' data-testid={`cities-${c.country}`}>
                    {c.cities.map((city) => (
                      <li key={city.city} className='flex items-center gap-3'>
                        <span className='text-muted-foreground flex-1 truncate'>{city.city}</span>
                        <span className='font-mono tabular-nums'>
                          {formatNumber(city.visitors)}
                        </span>
                        <span className='text-muted-foreground w-12 text-right font-mono text-xs tabular-nums'>
                          {city.percent}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
