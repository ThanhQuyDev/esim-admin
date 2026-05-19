'use client';

import { useQuery } from '@tanstack/react-query';
import { openTicketCountQueryOptions } from '../api/queries';

export function SidebarTicketsBadge() {
  const { data, isLoading } = useQuery({
    ...openTicketCountQueryOptions,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000
  });

  if (isLoading || !data || data <= 0) return null;

  return (
    <span
      className='ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-semibold text-white tabular-nums'
      aria-label={`${data} ticket đang mở`}
    >
      {data > 99 ? '99+' : data}
    </span>
  );
}
