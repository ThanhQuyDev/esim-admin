'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { OverviewGroupBy, OverviewPreset, OverviewProvider } from '../api/types';
import { OVERVIEW_PROVIDERS, providerCodeLabel } from '../api/constants';
import { PeriodRangePicker, snapRangeToGroupBy } from './period-range-picker';

export interface OverviewFiltersValue {
  preset?: OverviewPreset;
  groupBy: OverviewGroupBy;
  from?: string;
  to?: string;
  provider?: OverviewProvider;
}

interface OverviewFiltersProps {
  value: OverviewFiltersValue;
  onChange: (value: OverviewFiltersValue) => void;
}

const presetOptions: { value: OverviewPreset; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: 'last7days', label: '7 ngày qua' },
  { value: 'last30days', label: '30 ngày qua' }
];

const groupByOptions: { value: OverviewGroupBy; label: string }[] = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' }
];

const providerOptions: { value: OverviewProvider | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả provider' },
  ...OVERVIEW_PROVIDERS.map((value) => ({
    value,
    // Masked on purpose — see providerCodeLabel.
    label: providerCodeLabel(value)
  }))
];

export function OverviewFilters({ value, onChange }: OverviewFiltersProps) {
  return (
    <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
      <Tabs
        value={value.preset ?? ''}
        onValueChange={(preset) =>
          onChange({
            ...value,
            preset: preset as OverviewPreset,
            from: undefined,
            to: undefined
          })
        }
      >
        <TabsList className='h-auto flex-wrap'>
          {presetOptions.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value}>
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className='flex flex-wrap items-center gap-2'>
        <Select
          value={value.groupBy}
          onValueChange={(groupBy) =>
            // Re-snap the chosen range to the new granularity: switching to
            // "Tháng" while looking at 12–20/09 must widen to the whole month,
            // otherwise the single bar shown would cover only part of it.
            onChange({
              ...value,
              groupBy: groupBy as OverviewGroupBy,
              ...snapRangeToGroupBy(groupBy as OverviewGroupBy, value.from, value.to)
            })
          }
        >
          <SelectTrigger className='w-[120px]'>
            <Icons.calendar className='mr-1 h-4 w-4' />
            <SelectValue placeholder='Nhóm theo' />
          </SelectTrigger>
          <SelectContent>
            {groupByOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* The picker follows "Nhóm theo": days for Ngày/Tuần, a month grid
            for Tháng, a year grid for Năm — and it snaps the range to whole
            periods so the chart buckets match the label on the button. */}
        <PeriodRangePicker
          groupBy={value.groupBy}
          from={value.from}
          to={value.to}
          onChange={(range) =>
            onChange({
              ...value,
              // A hand-picked range replaces the quick preset.
              preset: range.from ? undefined : 'last7days',
              from: range.from,
              to: range.to
            })
          }
        />

        <Select
          value={value.provider ?? 'all'}
          onValueChange={(provider) =>
            onChange({
              ...value,
              provider: provider === 'all' ? undefined : (provider as OverviewProvider)
            })
          }
        >
          <SelectTrigger className='w-[160px]'>
            <Icons.adjustments className='mr-1 h-4 w-4' />
            <SelectValue placeholder='Provider' />
          </SelectTrigger>
          <SelectContent>
            {providerOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant='outline'
          size='icon'
          onClick={() =>
            onChange({
              preset: 'last7days',
              groupBy: 'day',
              provider: undefined
            })
          }
          title='Reset bộ lọc'
        >
          <Icons.close className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
