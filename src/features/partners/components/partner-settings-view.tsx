'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import { partnerOverviewQueryOptions, tiersQueryOptions } from '../api/queries';
import type { PartnerTier } from '../api/types';

const num = (v: string | number) => Number(v ?? 0);

function TierTable({
  tiers,
  metricLabel,
  metric
}: {
  tiers: PartnerTier[];
  metricLabel: string;
  metric: (t: PartnerTier) => string;
}) {
  if (tiers.length === 0) {
    return (
      <p className='text-muted-foreground rounded-lg border p-6 text-center text-sm'>
        Chưa cấu hình hạng nào.{' '}
        <Link href='/dashboard/partners/tiers' className='underline underline-offset-4'>
          Thêm hạng
        </Link>
      </p>
    );
  }
  return (
    <div className='overflow-x-auto rounded-lg border'>
      <table className='w-full text-sm'>
        <thead className='bg-muted/50 text-muted-foreground text-xs'>
          <tr>
            <th className='px-3 py-2 text-left font-medium'>Hạng</th>
            <th className='px-3 py-2 text-left font-medium'>Mã</th>
            <th className='px-3 py-2 text-right font-medium'>Doanh số tối thiểu</th>
            <th className='px-3 py-2 text-right font-medium'>{metricLabel}</th>
            <th className='px-3 py-2 text-left font-medium'>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((t) => (
            <tr key={t.id} className='border-t'>
              <td className='px-3 py-2 font-medium'>{t.tierName}</td>
              <td className='px-3 py-2 font-mono text-xs'>{t.tierCode}</td>
              <td className='px-3 py-2 text-right'>
                {num(t.minVolumeVnd) === 0 ? '—' : formatVnd(num(t.minVolumeVnd))}
              </td>
              <td className='px-3 py-2 text-right'>{metric(t)}</td>
              <td className='px-3 py-2'>
                <Badge variant={t.isActive ? 'default' : 'secondary'}>
                  {t.isActive ? 'Đang áp dụng' : 'Tạm dừng'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PartnerSettingsView() {
  const { data: overview, isLoading: loadingOverview } = useQuery(partnerOverviewQueryOptions());
  const { data: tiers, isLoading: loadingTiers } = useQuery(tiersQueryOptions());

  if (loadingOverview || loadingTiers || !overview) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  const all = tiers ?? [];
  const kolTiers = all.filter((t) => t.partnerType === 'kol');
  const distributionTiers = all.filter((t) => t.partnerType === 'distribution');

  return (
    <div className='space-y-6'>
      <div className='rounded-lg border p-4'>
        <p className='mb-3 text-sm font-medium'>Ngưỡng của chương trình</p>
        <dl className='grid gap-4 sm:grid-cols-2'>
          <div>
            <dt className='text-muted-foreground text-xs'>Rút tiền tối thiểu</dt>
            <dd className='text-lg font-semibold'>{formatVnd(overview.policy.payoutMinVnd)}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground text-xs'>Nạp ký quỹ tối thiểu</dt>
            <dd className='text-lg font-semibold'>{formatVnd(overview.policy.depositMinVnd)}</dd>
          </div>
        </dl>
        <p className='text-muted-foreground mt-3 text-xs'>
          Các ngưỡng này được kiểm tra ở backend khi đối tác tạo yêu cầu, nên số hiển thị ở đây luôn
          khớp với quy tắc đang chạy.
        </p>
      </div>

      <div>
        <div className='mb-3 flex items-center justify-between'>
          <p className='text-sm font-medium'>Chính sách đối tác tiếp thị (KOL)</p>
          <Link
            href='/dashboard/partners/tiers'
            className='text-sm font-medium underline underline-offset-4'
          >
            Sửa hạng
          </Link>
        </div>
        <p className='text-muted-foreground mb-2 text-xs'>
          Hoa hồng tính theo % giá trị đơn hàng quy về link tiếp thị, chốt theo hạng tại thời điểm
          phát sinh đơn.
        </p>
        <TierTable
          tiers={kolTiers}
          metricLabel='Hoa hồng'
          metric={(t) => `${num(t.commissionPercent)}%`}
        />
      </div>

      <div>
        <p className='mb-3 text-sm font-medium'>Chính sách đối tác phân phối</p>
        <p className='text-muted-foreground mb-2 text-xs'>
          Đối tác phân phối nạp ký quỹ và mua theo giá vốn; hạng quyết định mức chiết khấu tối đa
          được áp dụng.
        </p>
        <TierTable
          tiers={distributionTiers}
          metricLabel='Chiết khấu tối đa'
          metric={(t) => `${num(t.maxDiscountPercent)}%`}
        />
      </div>
    </div>
  );
}
