'use client';

/**
 * The four figures at the head of "Danh sách đối tác" (#057).
 *
 * All four are about the state of the accounts, which is what the page below
 * them lists. That is a different question from the overview's "đang hoạt
 * động", which counts who actually traded (#051) — so the labels here say
 * plainly that they are account states, and the two screens cannot be read as
 * contradicting each other.
 *
 * Locked accounts are left out of the total because the brief says so: counting
 * accounts nobody can use would overstate the programme.
 */

import { useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent } from '@/components/ui/card';

import { partnerListStatsQueryOptions } from '../api/queries';

const PARTNER_TYPE_LABEL: Record<string, string> = {
  kol: 'Affiliate',
  distribution: 'Phân phối',
  api: 'API'
};

/** One partner type's figure out of a split. */
const of = (rows: { partnerType: string; count: number }[] | undefined, type: string) =>
  rows?.find((row) => row.partnerType === type)?.count ?? 0;

const count = (value: number | undefined) => (value ?? 0).toLocaleString('vi-VN');

const noSubscribe = () => () => {};

export function PartnerListStats() {
  const { data: loaded } = useQuery(partnerListStatsQueryOptions());
  // The figures are drawn in the browser only: the server rendered them before
  // its prefetch answered ("0") while the browser already had them ("2"), and
  // the page ended in a hydration error (React #418) since #040 made the
  // console render on the server.
  const inBrowser = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  );
  const data = inBrowser ? loaded : undefined;

  // The partner types that have anybody, in a steady order.
  const types = ['distribution', 'kol', 'api'].filter((type) =>
    (data?.total.byType ?? []).some((row) => row.partnerType === type && row.count > 0)
  );

  // Two lines rather than four tall cards, so the list below keeps its room
  // (doitac-3010 #034): the totals, then the same figures by partner type.
  return (
    <Card className='gap-0 py-3' data-testid='partner-list-stats'>
      <CardContent className='space-y-1.5 px-4 text-sm'>
        <div className='flex flex-wrap items-baseline gap-x-6 gap-y-1'>
          <span>
            Tổng số đối tác: <strong className='tabular-nums'>{count(data?.total.count)}</strong>{' '}
            <span className='text-muted-foreground text-xs'>(không tính tài khoản đã khoá)</span>
          </span>
          <span>
            Đang hoạt động: <strong className='tabular-nums'>{count(data?.active.count)}</strong>
            <span className='text-muted-foreground'>
              {' '}
              – {data?.active.percentOfTotal ?? 0}% trên tổng hệ thống
            </span>
          </span>
          <span>
            Mới trong tháng:{' '}
            <strong className='tabular-nums'>{count(data?.newThisMonth.count)}</strong>
          </span>
          <span>
            Đang tạm khoá: <strong className='tabular-nums'>{count(data?.onHold.count)}</strong>
          </span>
        </div>
        <div className='text-muted-foreground flex flex-wrap items-baseline gap-x-6 gap-y-1 text-xs'>
          {types.length === 0 ? (
            <span>Chưa có đối tác nào.</span>
          ) : (
            types.map((type) => (
              <span key={type} data-testid={`partner-list-stats-${type}`}>
                <span className='text-foreground font-medium'>{PARTNER_TYPE_LABEL[type]}</span>:{' '}
                {count(of(data?.total.byType, type))} đối tác · hoạt động{' '}
                {count(of(data?.active.byType, type))} · mới{' '}
                {count(of(data?.newThisMonth.byType, type))} · tạm khoá{' '}
                {count(of(data?.onHold.byType, type))}
              </span>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
