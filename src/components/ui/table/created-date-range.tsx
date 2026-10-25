'use client';

import { useTransition } from 'react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Input } from '@/components/ui/input';

/**
 * "Thời gian tạo Từ – đến" for a list toolbar (vande #041), the same native
 * date boxes as the orders list (#017): the days go into the URL as
 * `createdFrom` / `createdTo` (yyyy-mm-dd) and back to page 1.
 */
export function CreatedDateRange({ idPrefix }: { idPrefix: string }) {
  const [, startTransition] = useTransition();
  const [params, setParams] = useQueryStates({
    createdFrom: parseAsString,
    createdTo: parseAsString,
    page: parseAsInteger.withDefault(1)
  });

  return (
    <div className='flex items-center gap-2' data-testid={`${idPrefix}-created-range`}>
      <label
        htmlFor={`${idPrefix}-created-from`}
        className='text-muted-foreground text-sm whitespace-nowrap'
      >
        Tạo từ
      </label>
      <Input
        id={`${idPrefix}-created-from`}
        type='date'
        className='h-8 w-40'
        value={params.createdFrom ?? ''}
        max={params.createdTo ?? undefined}
        onChange={(e) =>
          startTransition(() => {
            void setParams({ createdFrom: e.target.value || null, page: 1 });
          })
        }
      />
      <label htmlFor={`${idPrefix}-created-to`} className='text-muted-foreground text-sm'>
        đến
      </label>
      <Input
        id={`${idPrefix}-created-to`}
        type='date'
        className='h-8 w-40'
        value={params.createdTo ?? ''}
        min={params.createdFrom ?? undefined}
        onChange={(e) =>
          startTransition(() => {
            void setParams({ createdTo: e.target.value || null, page: 1 });
          })
        }
      />
    </div>
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
