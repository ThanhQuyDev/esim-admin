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

export interface OverviewFiltersValue {
  preset: OverviewPreset;
  groupBy: OverviewGroupBy;
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
  { value: 'airalo', label: 'Airalo' },
  { value: 'esimaccess', label: 'eSIM Access' },
  { value: 'gadgetkorea', label: 'Gadget Korea' }
];

export function OverviewFilters({ value, onChange }: OverviewFiltersProps) {
  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <Tabs
        value={value.preset}
        onValueChange={(preset) => onChange({ ...value, preset: preset as OverviewPreset })}
      >
        <TabsList>
          {presetOptions.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value}>
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className='flex items-center gap-2'>
        <Select
          value={value.groupBy}
          onValueChange={(groupBy) => onChange({ ...value, groupBy: groupBy as OverviewGroupBy })}
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
          onClick={() => onChange({ preset: 'last7days', groupBy: 'day', provider: undefined })}
          title='Reset bộ lọc'
        >
          <Icons.close className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
