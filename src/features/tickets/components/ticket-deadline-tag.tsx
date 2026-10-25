'use client';

import { useEffect, useState } from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { Ticket } from '../api/types';
import { formatSpan, ticketDeadline } from '../utils/ticket-deadline';

/** The current time, moving once a minute so a deadline counts down on screen. */
function useNow(stepMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), stepMs);
    return () => clearInterval(timer);
  }, [stepMs]);
  return now;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "16:34 25/10" — when the answer is due. */
function formatDueAt(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/**
 * "Thời hạn xử lý" (vande #070): red "Trễ hẹn 1 ngày 17 giờ" once the three
 * hours are up, amber in the last hour, the time left otherwise.
 */
export function TicketDeadlineTag({
  ticket,
  className
}: {
  ticket: Pick<Ticket, 'status' | 'createdAt' | 'lastReplyAt' | 'lastReplyRole'>;
  className?: string;
}) {
  const now = useNow();
  const deadline = ticketDeadline(ticket, now);

  if (deadline.state === 'none') {
    const label =
      deadline.reason === 'answered'
        ? 'Đã phản hồi, chờ khách'
        : deadline.reason === 'waiting_customer'
          ? 'Chờ khách bổ sung'
          : '—';
    return (
      <span
        className={cn('text-muted-foreground text-xs whitespace-nowrap', className)}
        data-testid='ticket-deadline'
        data-state='none'
      >
        {label}
      </span>
    );
  }

  const overdue = deadline.state === 'overdue';
  const soon = !overdue && deadline.msLeft < 60 * 60 * 1000;
  return (
    <div
      className={cn('flex flex-col gap-0.5', className)}
      data-testid='ticket-deadline'
      data-state={overdue ? 'overdue' : soon ? 'soon' : 'due'}
    >
      <span
        className={cn(
          'inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
          overdue
            ? 'bg-red-600 text-white dark:bg-red-700'
            : soon
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
        )}
      >
        {overdue && <Icons.warning className='h-3 w-3' />}
        {overdue ? `Trễ hẹn ${formatSpan(deadline.msLeft)}` : `Còn ${formatSpan(deadline.msLeft)}`}
      </span>
      <span className='text-muted-foreground text-xs tabular-nums whitespace-nowrap'>
        Hạn: {formatDueAt(deadline.dueAt)}
      </span>
    </div>
  );
}
