'use client';

/**
 * "12 (tháng trước 5, +140%)" on the one-line month summaries of Quản lý eSIM
 * and Đơn hàng (doitac-3010 #028, #029).
 */

import { cn } from '@/lib/utils';

/** "12 (tháng trước 5, +140%)" — the change, when there is something to compare. */
export function Compared({
  value,
  previous,
  format = (n) => n.toLocaleString('vi-VN')
}: {
  value: number;
  previous: number;
  format?: (n: number) => string;
}) {
  const change = previous > 0 ? Math.round(((value - previous) / previous) * 100) : null;
  return (
    <span className='whitespace-nowrap'>
      <strong className='tabular-nums'>{format(value)}</strong>
      <span className='text-muted-foreground'>
        {' '}
        (tháng trước {format(previous)}
        {change !== null && (
          <span
            className={cn(
              change > 0 && 'text-emerald-600 dark:text-emerald-400',
              change < 0 && 'text-red-600 dark:text-red-400'
            )}
          >
            , {change > 0 ? '+' : ''}
            {change}%
          </span>
        )}
        )
      </span>
    </span>
  );
}
