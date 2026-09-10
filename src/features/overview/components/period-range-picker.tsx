'use client';

import { useMemo, useState } from 'react';
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getISOWeek,
  parse,
  startOfMonth,
  startOfWeek,
  startOfYear
} from 'date-fns';
import { vi } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { OverviewGroupBy } from '../api/types';

/** ISO weeks start on Monday, which is how the backend buckets them too. */
const WEEK_OPTS = { weekStartsOn: 1 } as const;

const API_FORMAT = 'yyyy-MM-dd';

function toApi(date: Date): string {
  return format(date, API_FORMAT);
}

function fromApi(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, API_FORMAT, new Date());
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Snap a picked range outwards to whole periods.
 *
 * Picking "some day in week 37" has to mean the WHOLE of week 37, otherwise the
 * chart buckets (which the backend groups by week/month/year) would show a
 * partial first and last bar and the totals would quietly disagree with the
 * date range printed on the button.
 */
function snapRange(groupBy: OverviewGroupBy, from: Date, to: Date): { from: Date; to: Date } {
  switch (groupBy) {
    case 'week':
      return { from: startOfWeek(from, WEEK_OPTS), to: endOfWeek(to, WEEK_OPTS) };
    case 'month':
      return { from: startOfMonth(from), to: endOfMonth(to) };
    case 'year':
      return { from: startOfYear(from), to: endOfYear(to) };
    default:
      return { from, to };
  }
}

/**
 * Re-snap an already chosen range when the granularity changes. Returns the
 * fields to merge into the filter value; `{}` when there is nothing selected.
 */
export function snapRangeToGroupBy(
  groupBy: OverviewGroupBy,
  from?: string,
  to?: string
): { from?: string; to?: string } {
  const start = fromApi(from);
  if (!start) return {};

  const snapped = snapRange(groupBy, start, fromApi(to) ?? start);
  return { from: toApi(snapped.from), to: toApi(snapped.to) };
}

function rangeLabel(groupBy: OverviewGroupBy, from?: Date, to?: Date): string {
  if (!from) return 'Chọn khoảng thời gian';

  const one = (d: Date) => {
    switch (groupBy) {
      case 'week':
        return `Tuần ${getISOWeek(d)}/${format(d, 'yyyy')}`;
      case 'month':
        return format(d, 'MM/yyyy');
      case 'year':
        return format(d, 'yyyy');
      default:
        return format(d, 'dd/MM/yyyy');
    }
  };

  const start = one(from);
  const end = to ? one(to) : null;
  return !end || end === start ? start : `${start} - ${end}`;
}

interface GridPickerProps {
  /** Cells to render, already ordered. */
  items: { key: string; label: string; date: Date }[];
  from?: Date;
  to?: Date;
  onPick: (date: Date) => void;
  /** Header with the year (or decade) navigation. */
  header: React.ReactNode;
  columns: 2 | 3 | 4;
}

/** Shared grid used by the month and year pickers. */
function GridPicker({ items, from, to, onPick, header, columns }: GridPickerProps) {
  const inRange = (date: Date) => {
    if (!from) return false;
    const end = to ?? from;
    return date >= from && date <= end;
  };

  return (
    <div className='p-3'>
      {header}
      <div
        className={cn(
          'mt-3 grid gap-2',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-3',
          columns === 4 && 'grid-cols-4'
        )}
      >
        {items.map((item) => (
          <Button
            key={item.key}
            type='button'
            size='sm'
            variant={inRange(item.date) ? 'default' : 'ghost'}
            // There is no data in the future; the day calendar blocks it too.
            disabled={item.date > new Date()}
            onClick={() => onPick(item.date)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface PeriodRangePickerProps {
  groupBy: OverviewGroupBy;
  from?: string;
  to?: string;
  onChange: (range: { from?: string; to?: string }) => void;
}

/**
 * Date-range picker whose grid follows the "xem theo" granularity: days for
 * Ngày/Tuần, a month grid for Tháng, a year grid for Năm — so an admin looking
 * at monthly figures picks months instead of hunting for the 1st and the 31st
 * on a day calendar.
 */
export function PeriodRangePicker({ groupBy, from, to, onChange }: PeriodRangePickerProps) {
  const selectedFrom = fromApi(from);
  const selectedTo = fromApi(to);

  // Anchor for the month/year grids; follows the current selection.
  const [anchor, setAnchor] = useState<Date>(selectedFrom ?? new Date());
  // Half-finished range: first click sets the start, second sets the end.
  const [pendingStart, setPendingStart] = useState<Date | null>(null);

  const label = rangeLabel(groupBy, selectedFrom, selectedTo);

  const emit = (start: Date, end: Date) => {
    const snapped = snapRange(groupBy, start, end);
    onChange({ from: toApi(snapped.from), to: toApi(snapped.to) });
  };

  const handleGridPick = (date: Date) => {
    if (!pendingStart) {
      setPendingStart(date);
      emit(date, date);
      return;
    }

    const [start, end] = pendingStart <= date ? [pendingStart, date] : [date, pendingStart];
    setPendingStart(null);
    emit(start, end);
  };

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const date = new Date(anchor.getFullYear(), index, 1);
        return {
          key: `m-${index}`,
          label: format(date, 'MMM', { locale: vi }),
          date
        };
      }),
    [anchor]
  );

  const years = useMemo(() => {
    // A 12-year page, ending on the anchor's year so "this year" is visible.
    const lastYear = anchor.getFullYear();
    return Array.from({ length: 12 }, (_, index) => {
      const year = lastYear - 11 + index;
      const date = new Date(year, 0, 1);
      return { key: `y-${year}`, label: String(year), date };
    });
  }, [anchor]);

  const shiftAnchor = (years: number) => {
    setAnchor((current) => new Date(current.getFullYear() + years, current.getMonth(), 1));
  };

  const gridHeader = (title: string, step: number) => (
    <div className='flex items-center justify-between'>
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='size-7'
        onClick={() => shiftAnchor(-step)}
        aria-label='Lùi lại'
      >
        <Icons.chevronLeft className='h-4 w-4' />
      </Button>
      <span className='text-sm font-medium'>{title}</span>
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='size-7'
        onClick={() => shiftAnchor(step)}
        aria-label='Tiến tới'
      >
        <Icons.chevronRight className='h-4 w-4' />
      </Button>
    </div>
  );

  const dayRange: DateRange | undefined = selectedFrom
    ? { from: selectedFrom, to: selectedTo }
    : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          data-testid='overview-period-range'
          className={cn(
            'w-full justify-start text-left font-normal sm:w-[250px]',
            !selectedFrom && 'text-muted-foreground'
          )}
        >
          <Icons.calendar className='mr-2 h-4 w-4' />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='end'>
        {groupBy === 'month' ? (
          <GridPicker
            items={months}
            from={selectedFrom}
            to={selectedTo}
            onPick={handleGridPick}
            columns={3}
            header={gridHeader(String(anchor.getFullYear()), 1)}
          />
        ) : groupBy === 'year' ? (
          <GridPicker
            items={years}
            from={selectedFrom}
            to={selectedTo}
            onPick={handleGridPick}
            columns={4}
            header={gridHeader(`${years[0]?.label} - ${years[years.length - 1]?.label}`, 12)}
          />
        ) : (
          <Calendar
            mode='range'
            selected={dayRange}
            onSelect={(range) => {
              if (!range?.from) return;
              emit(range.from, range.to ?? range.from);
            }}
            numberOfMonths={2}
            locale={vi}
            weekStartsOn={WEEK_OPTS.weekStartsOn}
            // Whole weeks highlight together so it is obvious that picking any
            // day selects its entire week.
            showWeekNumber={groupBy === 'week'}
            disabled={{ after: new Date() }}
          />
        )}

        {selectedFrom && (
          <div className='flex justify-end border-t p-2'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => {
                setPendingStart(null);
                onChange({ from: undefined, to: undefined });
              }}
            >
              Xoá khoảng thời gian
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
