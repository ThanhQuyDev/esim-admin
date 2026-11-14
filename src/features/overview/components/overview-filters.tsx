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
import { type DatePreset, presetOfRange, resolveDatePreset } from '@/lib/date-presets';
import type { OverviewGroupBy, OverviewPreset, OverviewProvider } from '../api/types';
import { OVERVIEW_PROVIDERS } from '../api/constants';
import { useProviderCodeLabel } from '../api/use-provider-code-label';
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

// The full set of every page (doitac-3010 #031). The server knows the first
// four; "Tuần trước" / "Tháng trước" are sent as their days.
const presetOptions: { value: OverviewPreset | DatePreset; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: 'last7days', label: '7 ngày qua' },
  { value: 'last30days', label: '30 ngày qua' },
  { value: 'lastWeek', label: 'Tuần trước' },
  { value: 'lastMonth', label: 'Tháng trước' }
];

const groupByOptions: { value: OverviewGroupBy; label: string }[] = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' }
];

export function OverviewFilters({ value, onChange }: OverviewFiltersProps) {
  // Masked on purpose — the codes set in "Danh sách Nhà cung cấp" (vande-1411 #024).
  const providerCodeLabel = useProviderCodeLabel();
  const providerOptions: { value: OverviewProvider | 'all'; label: string }[] = [
    { value: 'all', label: 'Tất cả provider' },
    ...OVERVIEW_PROVIDERS.map((value) => ({
      value,
      label: providerCodeLabel(value)
    }))
  ];
  return (
    <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
      <Tabs
        value={
          value.preset ??
          (value.groupBy === 'day' ? presetOfRange(value.from, value.to) : null) ??
          ''
        }
        onValueChange={(preset) =>
          onChange(
            preset === 'lastWeek' || preset === 'lastMonth'
              ? {
                  ...value,
                  preset: undefined,
                  groupBy: 'day',
                  ...resolveDatePreset(preset)
                }
              : {
                  ...value,
                  preset: preset as OverviewPreset,
                  from: undefined,
                  to: undefined
                }
          )
        }
      >
        {/* Two rows of three on a phone (vande-0411 #023): wrapped in a flex row
            the triggers overflowed the grey box and the second line took no
            taps. Same as the partners' overview. */}
        <TabsList className='grid h-auto w-full grid-cols-3 gap-1 sm:flex sm:w-auto sm:flex-wrap'>
          {presetOptions.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value} className='px-2 sm:px-3'>
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className='flex flex-wrap items-center gap-2' data-testid='overview-filter-controls'>
        <div className='flex w-full items-center gap-2 sm:w-auto'>
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
            <SelectTrigger className='w-[120px] shrink-0'>
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
                preset: range.from ? undefined : 'today',
                from: range.from,
                to: range.to
              })
            }
          />
        </div>

        <Select
          value={value.provider ?? 'all'}
          onValueChange={(provider) =>
            onChange({
              ...value,
              provider: provider === 'all' ? undefined : (provider as OverviewProvider)
            })
          }
        >
          <SelectTrigger className='w-[190px]'>
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
              preset: 'today',
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
