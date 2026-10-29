'use client';

/**
 * Period filter for the partner dashboard (#010).
 *
 * Same vocabulary as the admin console's overview filter — quick presets, a
 * "nhóm theo" granularity and the calendar picker — minus the provider select,
 * which a partner has no business filtering by. The picker component itself is
 * the admin one, so the two dashboards keep behaving identically.
 */

import { Icons } from '@/components/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PeriodRangePicker,
  snapRangeToGroupBy
} from '@/features/overview/components/period-range-picker';
import type { OverviewGroupBy, OverviewPreset } from '@/features/overview/api/types';

/**
 * The admin overview's presets plus "Tuần trước" / "Tháng trước" (vande #085):
 * the calendar week (Monday–Sunday) and month before this one. Resolved to
 * dates here, so the server never sees them.
 */
export type PortalPreset = OverviewPreset | 'lastWeek' | 'lastMonth';

export interface PortalPeriod {
  preset?: PortalPreset;
  groupBy: OverviewGroupBy;
  from?: string;
  to?: string;
}

export const DEFAULT_PORTAL_PERIOD: PortalPeriod = {
  preset: 'last30days',
  groupBy: 'day'
};

const presetOptions: { value: PortalPreset; label: string }[] = [
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

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Concrete day bounds for whatever the partner chose.
 *
 * Presets are turned into dates here rather than on the server, so the window
 * follows the partner's own clock — "Hôm nay" in Hanoi is not "today" in UTC.
 */
export function resolvePeriod(period: PortalPeriod): { from: string; to: string } {
  if (period.from) {
    return { from: period.from, to: period.to ?? period.from };
  }

  const today = new Date();
  const start = new Date(today);

  switch (period.preset) {
    case 'today':
      break;
    case 'yesterday':
      start.setDate(today.getDate() - 1);
      today.setDate(today.getDate() - 1);
      break;
    case 'last7days':
      start.setDate(today.getDate() - 6);
      break;
    case 'lastWeek': {
      // Monday to Sunday of the week before this one.
      const sinceMonday = (today.getDay() + 6) % 7;
      start.setDate(today.getDate() - sinceMonday - 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { from: iso(start), to: iso(end) };
    }
    case 'lastMonth': {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: iso(first), to: iso(last) };
    }
    default:
      start.setDate(today.getDate() - 29);
  }

  return { from: iso(start), to: iso(today) };
}

/** What the header says the figures cover. */
export function periodLabel(period: PortalPeriod): string {
  if (period.from) {
    const to = period.to ?? period.from;
    return period.from === to ? period.from : `${period.from} – ${to}`;
  }
  return presetOptions.find((p) => p.value === period.preset)?.label ?? '30 ngày qua';
}

interface PortalPeriodFilterProps {
  value: PortalPeriod;
  onChange: (value: PortalPeriod) => void;
}

export function PortalPeriodFilter({ value, onChange }: PortalPeriodFilterProps) {
  return (
    <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
      <Tabs
        value={value.preset ?? ''}
        onValueChange={(preset) =>
          onChange({
            ...value,
            preset: preset as PortalPreset,
            from: undefined,
            to: undefined
          })
        }
      >
        {/* Six presets (vande #085): a 3-column grid on a phone, where one
            wrapping row spilled over the controls below it. */}
        <TabsList className='grid h-auto w-full grid-cols-3 gap-1 sm:flex sm:w-auto sm:flex-wrap'>
          {presetOptions.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value} className='px-2 sm:px-3'>
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className='flex flex-wrap items-center gap-2'>
        <Select
          value={value.groupBy}
          onValueChange={(groupBy) =>
            // Re-snap the range so a chosen week does not stay half a month
            // when the granularity changes, exactly as the admin filter does.
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

        <PeriodRangePicker
          groupBy={value.groupBy}
          from={value.from}
          to={value.to}
          onChange={(range) =>
            onChange({
              ...value,
              // A hand-picked range replaces the quick preset.
              preset: range.from ? undefined : 'last30days',
              from: range.from,
              to: range.to
            })
          }
        />
      </div>
    </div>
  );
}
