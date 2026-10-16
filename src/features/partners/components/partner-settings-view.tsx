'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import { partnerOverviewQueryOptions, tiersQueryOptions } from '../api/queries';
import { ProgramSettingsForm } from './program-settings-form';
import { DepositPromotionsCard } from './deposit-promotions-card';
import type { PartnerTier } from '../api/types';

const num = (v: string | number | undefined) => Number(v ?? 0);

/** A policy column beyond the thresholds every tier has (doitac-1410 #061). */
type TierColumn = { label: string; value: (t: PartnerTier) => string };

function TierTable({ tiers, columns }: { tiers: PartnerTier[]; columns: TierColumn[] }) {
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
            {columns.map((c) => (
              <th key={c.label} className='px-3 py-2 text-right font-medium'>
                {c.label}
              </th>
            ))}
            <th className='px-3 py-2 text-left font-medium'>Loại hạng</th>
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
              {columns.map((c) => (
                <td key={c.label} className='px-3 py-2 text-right whitespace-nowrap'>
                  {c.value(t)}
                </td>
              ))}
              <td className='px-3 py-2'>
                <Badge variant={t.isInternal ? 'secondary' : 'outline'}>
                  {t.isInternal ? 'Nội bộ' : 'Công khai'}
                </Badge>
              </td>
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
    <div className='grid min-w-0 grid-cols-1 gap-6'>
      <ProgramSettingsForm />

      {/* Bonus balance on deposits, set up ahead of time (doitac-1410 #015). */}
      <DepositPromotionsCard />

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
          columns={[
            { label: 'Hoa hồng', value: (t) => `${num(t.commissionPercent)}%` },
            // doitac-1410 #061
            { label: 'Số ngày ghi nhận hoa hồng', value: (t) => `${t.attributionDays ?? 30} ngày` }
          ]}
        />
      </div>

      <div>
        <p className='mb-3 text-sm font-medium'>Chính sách đối tác phân phối</p>
        <p className='text-muted-foreground mb-2 text-xs'>
          Đối tác phân phối nạp ký quỹ và mua theo giá gốc cộng thêm % theo hạng. Lên hạng khi đạt
          ngưỡng doanh số HOẶC ngưỡng ký quỹ — chỉ cần một trong hai.
        </p>
        <TierTable
          tiers={distributionTiers}
          columns={[
            { label: 'Giá gốc +%', value: (t) => `+${num(t.costMarkupPercent)}%` },
            // doitac-1410 #061
            {
              label: 'Ngưỡng ký quỹ',
              value: (t) => (num(t.minDepositVnd) > 0 ? formatVnd(num(t.minDepositVnd)) : '—')
            },
            { label: 'Chiết khấu %', value: (t) => `${num(t.maxDiscountPercent)}%` }
          ]}
        />
      </div>
    </div>
  );
}
