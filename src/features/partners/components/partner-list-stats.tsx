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

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { partnerListStatsQueryOptions } from '../api/queries';

const PARTNER_TYPE_LABEL: Record<string, string> = {
  kol: 'KOL',
  distribution: 'Phân phối',
  api: 'API'
};

function Tile({
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
    <Card>
      <CardHeader className='pb-2'>
        <CardDescription>{label}</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums'>{value}</CardTitle>
        {hint && <p className='text-muted-foreground text-xs'>{hint}</p>}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className='text-muted-foreground text-xs'>Chưa có đối tác nào.</p>
        ) : (
          <div className='space-y-1'>
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
      </CardContent>
    </Card>
  );
}

const count = (value: number | undefined) => (value ?? 0).toLocaleString('vi-VN');

export function PartnerListStats() {
  const { data } = useQuery(partnerListStatsQueryOptions());

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      <Tile
        label='Tổng số đối tác'
        value={count(data?.total.count)}
        hint='Không tính tài khoản đã khoá'
        rows={data?.total.byType ?? []}
      />
      <Tile
        label='Đang hoạt động'
        value={count(data?.active.count)}
        hint={`${data?.active.percentOfTotal ?? 0}% trên tổng hệ thống`}
        rows={data?.active.byType ?? []}
      />
      <Tile
        label='Mới trong tháng'
        value={count(data?.newThisMonth.count)}
        hint='Tính từ đầu tháng này'
        rows={data?.newThisMonth.byType ?? []}
      />
      <Tile
        label='Đang tạm khoá'
        value={count(data?.onHold.count)}
        hint='Tạm giữ, chưa khoá hẳn'
        rows={data?.onHold.byType ?? []}
      />
    </div>
  );
}
