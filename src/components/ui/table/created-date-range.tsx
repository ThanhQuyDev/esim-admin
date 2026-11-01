'use client';

import { useTransition } from 'react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { DateRangeFilter } from '@/components/date-range-filter';

/**
 * "Thời gian tạo" for a list toolbar (vande #041), now the shared time filter
 * with its presets and calendar (doitac-3010 #031): the days go into the URL
 * as `createdFrom` / `createdTo` (yyyy-mm-dd) and back to page 1.
 */
export function CreatedDateRange({ idPrefix }: { idPrefix: string }) {
  const [, startTransition] = useTransition();
  const [params, setParams] = useQueryStates({
    createdFrom: parseAsString,
    createdTo: parseAsString,
    page: parseAsInteger.withDefault(1)
  });

  return (
    <DateRangeFilter
      label='Thời gian tạo'
      className='h-8'
      from={params.createdFrom ?? undefined}
      to={params.createdTo ?? undefined}
      onChange={(range) =>
        startTransition(() => {
          void setParams({
            createdFrom: range.from ?? null,
            createdTo: range.to ?? null,
            page: 1
          });
        })
      }
      testId={`${idPrefix}-created-range`}
    />
  );
}

/** "25/10/2026 14:05" in Vietnam time, for a "Thời gian tạo" column. */
export function formatCreatedAt(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
