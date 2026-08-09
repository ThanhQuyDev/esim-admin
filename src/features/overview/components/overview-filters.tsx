'use client';

import { format, parse } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { OverviewGroupBy, OverviewPreset, OverviewProvider } from '../api/types';

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
  { value: 'airalo', label: 'Airalo' },
  { value: 'esimaccess', label: 'eSIM Access' },
  { value: 'gadgetkorea', label: 'Gadget Korea' },
  { value: 'japantravelsim', label: 'Japan' },
  { value: 'viettel', label: 'Viettel' }
];

function parseDate(value?: string) {
  return value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
}

export function OverviewFilters({ value, onChange }: OverviewFiltersProps) {
  const selectedRange: DateRange | undefined = value.from
    ? { from: parseDate(value.from), to: parseDate(value.to) }
    : undefined;

  const rangeLabel = selectedRange?.from
    ? selectedRange.to
      ? `${format(selectedRange.from, 'dd/MM/yyyy')} - ${format(selectedRange.to, 'dd/MM/yyyy')}`
      : format(selectedRange.from, 'dd/MM/yyyy')
    : 'Chọn ngày';

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

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn(
                'w-full justify-start text-left font-normal sm:w-[250px]',
                !selectedRange?.from && 'text-muted-foreground'
              )}
            >
              <Icons.calendar className='mr-2 h-4 w-4' />
              {rangeLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='end'>
            <Calendar
              mode='range'
              selected={selectedRange}
              onSelect={(range) => {
                if (!range?.from) return;
                onChange({
                  ...value,
                  preset: undefined,
                  from: format(range.from, 'yyyy-MM-dd'),
                  to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined
                });
              }}
              numberOfMonths={2}
              locale={vi}
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>

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
