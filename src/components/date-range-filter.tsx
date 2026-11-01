'use client';

/**
 * The one time filter of every list (doitac-3010 #031): the dashboards' full
 * set — Hôm nay, Hôm qua, 7 ngày qua, 30 ngày qua, Tuần trước, Tháng trước —
 * and a calendar by ngày / tuần / tháng / năm, behind a single button so a
 * toolbar keeps its one row. It speaks plain days (`yyyy-MM-dd`), so a page
 * keeps passing `from` / `to` to its API as before.
 */

import { useState } from 'react';
import { format, parse } from 'date-fns';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PeriodRangePicker } from '@/features/overview/components/period-range-picker';
import type { OverviewGroupBy } from '@/features/overview/api/types';
import {
  DATE_PRESETS,
  type DatePreset,
  presetOfRange,
  resolveDatePreset
} from '@/lib/date-presets';
import { cn } from '@/lib/utils';

const GROUP_BY: { value: OverviewGroupBy; label: string }[] = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' }
];

const shortDay = (value: string) => {
  const d = parse(value, 'yyyy-MM-dd', new Date());
  return Number.isNaN(d.getTime()) ? value : format(d, 'dd/MM/yyyy');
};

/** What the button says: the preset's name, the days, or the placeholder. */
export function dateRangeLabel(from?: string, to?: string, placeholder = 'Mọi thời gian') {
  if (!from && !to) return placeholder;
  const preset = presetOfRange(from, to);
  if (preset) return DATE_PRESETS.find((p) => p.value === preset)!.label;
  const start = from ?? to!;
  const end = to ?? from!;
  return start === end ? shortDay(start) : `${shortDay(start)} – ${shortDay(end)}`;
}

export function DateRangeFilter({
  from,
  to,
  onChange,
  label,
  placeholder = 'Mọi thời gian',
  testId,
  className
}: {
  from?: string;
  to?: string;
  onChange: (range: { from?: string; to?: string }) => void;
  /** Says what is filtered, before the value: "Thời gian tạo". */
  label?: string;
  placeholder?: string;
  testId?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<OverviewGroupBy>('day');
  const active = Boolean(from || to);
  const current = presetOfRange(from, to);

  const pick = (preset: DatePreset) => {
    onChange(resolveDatePreset(preset));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className={cn('h-9 justify-start gap-2 font-normal', className)}
          data-testid={testId}
        >
          <Icons.calendar className='size-4 opacity-60' />
          {label && <span className='text-muted-foreground'>{label}:</span>}
          <span className={cn(!active && 'text-muted-foreground')}>
            {dateRangeLabel(from, to, placeholder)}
          </span>
          {active && (
            <span
              role='button'
              tabIndex={0}
              aria-label='Bỏ lọc thời gian'
              data-testid={testId ? `${testId}-clear` : undefined}
              className='ml-1 opacity-60 hover:opacity-100'
              onClick={(e) => {
                e.stopPropagation();
                onChange({ from: undefined, to: undefined });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange({ from: undefined, to: undefined });
                }
              }}
            >
              <Icons.xCircle className='size-4' />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[320px] space-y-3 p-3' align='start'>
        <div className='grid grid-cols-3 gap-1.5'>
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              type='button'
              size='sm'
              variant={current === preset.value ? 'default' : 'outline'}
              onClick={() => pick(preset.value)}
              data-testid={testId ? `${testId}-${preset.value}` : undefined}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div className='space-y-2 border-t pt-3'>
          <p className='text-muted-foreground text-xs'>Hoặc chọn theo lịch</p>
          <div className='grid grid-cols-4 gap-1'>
            {GROUP_BY.map((g) => (
              <Button
                key={g.value}
                type='button'
                size='sm'
                variant={groupBy === g.value ? 'secondary' : 'ghost'}
                onClick={() => setGroupBy(g.value)}
              >
                {g.label}
              </Button>
            ))}
          </div>
          <PeriodRangePicker
            groupBy={groupBy}
            from={current ? undefined : from}
            to={current ? undefined : to}
            onChange={(range) => onChange(range)}
          />
        </div>
        {active && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='w-full'
            onClick={() => {
              onChange({ from: undefined, to: undefined });
              setOpen(false);
            }}
          >
            Mọi thời gian
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
