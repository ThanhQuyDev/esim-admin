'use client';

/**
 * "Tiếp thị liên kết" — every partner's marketing links in one place
 * (doitac-1410 #051–#055). This file starts with the four figures on top
 * (#051); the filters, the list and the actions follow.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { formatVnd } from '@/lib/format';
import {
  DEFAULT_PORTAL_PERIOD,
  PortalPeriodFilter,
  resolvePeriod,
  type PortalPeriod
} from '@/features/partner-portal/components/portal-period-filter';

import { adminLinkStatsQueryOptions } from '../api/queries';

const TILE = 'from-primary/5 to-card dark:bg-card rounded-lg border bg-gradient-to-t p-4 shadow-xs';

function StatTile({
  label,
  value,
  hint,
  testId
}: {
  label: string;
  value: string;
  hint?: string;
  testId: string;
}) {
  return (
    <div className={TILE} data-slot='stat-tile' data-testid={testId}>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='mt-1 text-2xl font-semibold tabular-nums'>{value}</p>
      {hint && <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>}
    </div>
  );
}

const count = (n: number | undefined) => (n ?? 0).toLocaleString('vi-VN');

export function PartnerLinksAdminView() {
  // "Đổi trang đích trong 7 ngày" by default; the number follows the filter.
  const [period, setPeriod] = useState<PortalPeriod>({
    ...DEFAULT_PORTAL_PERIOD,
    preset: 'last7days'
  });
  const range = useMemo(() => resolvePeriod(period), [period]);
  const { data: stats, isLoading } = useQuery(adminLinkStatsQueryOptions(range));
  const dash = isLoading ? '…' : undefined;

  return (
    <div className='grid min-w-0 grid-cols-1 gap-4'>
      <PortalPeriodFilter value={period} onChange={setPeriod} />

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <StatTile
          testId='link-stat-total'
          label='Tổng số liên kết'
          value={dash ?? count(stats?.total.links)}
          hint={`${count(stats?.total.active)} đang bật · ${count(stats?.total.orders)} đơn · ${formatVnd(stats?.total.commissionVnd ?? 0)} hoa hồng`}
        />
        <StatTile
          testId='link-stat-retargeted'
          label={`Đổi trang đích trong ${stats?.days ?? 7} ngày`}
          value={dash ?? count(stats?.retargeted)}
          hint='Số liên kết được đổi trang đích trong kỳ đang chọn'
        />
        <StatTile
          testId='link-stat-suspended'
          label='Đang bị đình chỉ'
          value={dash ?? count(stats?.suspended.links)}
          hint={`${count(stats?.suspended.appealing)} đang kháng nghị`}
        />
        <StatTile
          testId='link-stat-restore'
          label='Chờ duyệt khôi phục'
          value={dash ?? count(stats?.restorePending.links)}
          hint={`${count(stats?.restorePending.deleted)} đã xóa · ${count(stats?.restorePending.paused)} đang tạm tắt`}
        />
      </div>
    </div>
  );
}
