'use client';

import { useQueries } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { countPlans } from '../api/service';
import { planKeys } from '../api/queries';

/**
 * With several APNs picked, how many plans each one has (vande #019).
 *
 * The list shows ten rows a page, sorted by date, so picking five APNs showed
 * plans of only two on the first page and read as "the filter drops APNs".
 * The counts show every picked APN is in the result.
 */
export function ApnFilterCounts({ filters }: { filters: Record<string, unknown> }) {
  const apns = Array.isArray(filters.apn) ? (filters.apn as string[]) : [];
  const results = useQueries({
    queries: apns.map((apn) => {
      const one = { ...filters, apn };
      return {
        queryKey: [...planKeys.all, 'apn-count', one],
        queryFn: () => countPlans(one)
      };
    })
  });
  if (apns.length < 2) return null;

  return (
    <div className='flex flex-wrap items-center gap-1.5 text-xs' data-testid='apn-filter-counts'>
      <span className='text-muted-foreground'>Số gói theo APN đã chọn:</span>
      {apns.map((apn, i) => (
        <Badge key={apn} variant='outline' className='font-mono font-normal'>
          {apn.trim()}: {results[i]?.data ?? '…'}
        </Badge>
      ))}
    </div>
  );
}
