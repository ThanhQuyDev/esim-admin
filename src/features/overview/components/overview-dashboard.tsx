'use client';

import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import PageContainer from '@/components/layout/page-container';
import { AdminNotificationBanner } from '@/features/partners/components/admin-notification-bell';
import { Badge } from '@/components/ui/badge';
import { AreaGraph } from './area-graph';
import { BarGraph } from './bar-graph';
import { AudienceCountries, AudienceCustomerGraph, AudienceDeviceGraph } from './audience-graphs';
import { OverviewKpiCards } from './overview-kpi-cards';
import { PieGraph } from './pie-graph';
import { ProfitBySourceGraph } from './profit-by-source-graph';
import { RecentSales } from './recent-sales';
import { OverviewFilters, type OverviewFiltersValue } from './overview-filters';
import type {
  OverviewFilters as OverviewFiltersType,
  OverviewGroupBy,
  OverviewPreset,
  OverviewProvider
} from '../api/types';
import { OVERVIEW_PROVIDERS, providerCodeLabel } from '../api/constants';

const presets = ['today', 'yesterday', 'last7days', 'last30days'] as const;
const groupings = ['day', 'week', 'month', 'year'] as const;
const providers = OVERVIEW_PROVIDERS;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function vnDateBoundary(value: string, endOfDay: boolean) {
  const [year, month, day] = value.split('-').map(Number);
  const hour = endOfDay ? 23 : 0;
  const minute = endOfDay ? 59 : 0;
  const second = endOfDay ? 59 : 0;
  const millisecond = endOfDay ? 999 : 0;

  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - VN_OFFSET_MS
  ).toISOString();
}

export function OverviewDashboard() {
  const [urlFilters, setUrlFilters] = useQueryStates(
    {
      preset: parseAsStringLiteral(presets).withDefault('last7days'),
      groupBy: parseAsStringLiteral(groupings).withDefault('day'),
      provider: parseAsStringLiteral(providers),
      from: parseAsString,
      to: parseAsString
    },
    { history: 'replace', shallow: true }
  );

  const filters: OverviewFiltersValue = {
    preset: urlFilters.from ? undefined : (urlFilters.preset as OverviewPreset),
    groupBy: urlFilters.groupBy as OverviewGroupBy,
    provider: (urlFilters.provider ?? undefined) as OverviewProvider | undefined,
    from: urlFilters.from ?? undefined,
    to: urlFilters.to ?? undefined
  };

  const queryFilters: OverviewFiltersType = {
    preset: filters.preset,
    groupBy: filters.groupBy,
    provider: filters.provider,
    from: filters.from ? vnDateBoundary(filters.from, false) : undefined,
    to: filters.from ? vnDateBoundary(filters.to ?? filters.from, true) : undefined
  };

  const handleFiltersChange = (next: OverviewFiltersValue) => {
    void setUrlFilters({
      preset: next.preset ?? null,
      groupBy: next.groupBy,
      provider: next.provider ?? null,
      from: next.from ?? null,
      to: next.to ?? null
    });
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        {/* What partners see at the top of their page (doitac-1410 #062). */}
        <AdminNotificationBanner />
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Tổng quan Overview</h2>
            <p className='text-muted-foreground text-sm'>
              Dữ liệu thống kê từ backend overview API.
            </p>
          </div>
          {/* Masked codes, not slugs: this badge is the most screenshotted
              part of the dashboard. */}
          <Badge variant='outline'>{providers.map(providerCodeLabel).join(' · ')}</Badge>
        </div>

        <OverviewFilters value={filters} onChange={handleFiltersChange} />

        {/* The five KPI cards (vande #059). */}
        <OverviewKpiCards filters={queryFilters} />

        {/* Row 1 pairs the two fixed-height charts, row 2 the two tall ones
            (#007). "Lợi nhuận theo provider" grows one block per supplier, so
            next to a 280px chart it left a big gap that got worse with every
            supplier added; it now sits beside the destination chart, which is
            sized to match it. */}
        <div className='grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>
            <BarGraph filters={queryFilters} />
          </div>
          <div className='col-span-4 md:col-span-3'>
            <AreaGraph filters={queryFilters} />
          </div>
          <div className='col-span-4'>
            <RecentSales filters={queryFilters} />
          </div>
          <div className='col-span-4 min-h-0 md:col-span-3'>
            <PieGraph filters={queryFilters} />
          </div>
          {/* Profit after partner commission, by kind of order (vande #016). */}
          <div className='col-span-4'>
            <ProfitBySourceGraph filters={queryFilters} />
          </div>
          {/* Visits and orders by device, replacing orders-only (vande #059). */}
          <div className='col-span-4 md:col-span-3'>
            <AudienceDeviceGraph filters={queryFilters} />
          </div>
        </div>

        {/* Who comes and who buys (vande #059). */}
        <div className='grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3'>
          <AudienceCustomerGraph filters={queryFilters} />
          <div className='md:col-span-1 xl:col-span-2'>
            <AudienceCountries filters={queryFilters} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
