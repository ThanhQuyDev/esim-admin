'use client';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTimeVn } from '@/lib/format';

import { getRelatedTickets } from '../api/service';
import { StatusTag } from './status-tag';

/**
 * "Lịch sử ticket" (doitac-3010 #006): from the second "Báo lỗi" / "Yêu cầu
 * hoàn tiền" about one eSIM — or one order, when no eSIM is named — the
 * earlier tickets are listed here, each opening in a new tab, so the admin
 * does not go back to the list to look for them.
 */
export function RelatedTickets({ ticketId }: { ticketId: number }) {
  const { data } = useQuery({
    queryKey: ['tickets', 'related', ticketId],
    queryFn: () => getRelatedTickets(ticketId)
  });
  if (!data?.length) return null;
  return (
    <Card data-testid='related-tickets'>
      <CardHeader>
        <CardTitle className='text-base'>Lịch sử ticket ({data.length})</CardTitle>
        <CardDescription>
          Các ticket khác của cùng {data[0].iccid ? 'ICCID' : 'mã đơn hàng'} này.
        </CardDescription>
      </CardHeader>
      <CardContent className='divide-y'>
        {data.map((ticket) => (
          <a
            key={ticket.id}
            href={`/dashboard/tickets/${ticket.id}`}
            target='_blank'
            rel='noreferrer'
            className='hover:bg-muted/40 flex flex-wrap items-center justify-between gap-2 py-2 text-sm'
          >
            <span className='min-w-0'>
              <span className='font-mono'>{ticket.ticketNumber}</span> · {ticket.subject}
            </span>
            <span className='flex items-center gap-2'>
              <StatusTag status={ticket.status} />
              <span className='text-muted-foreground text-xs'>
                {formatDateTimeVn(ticket.createdAt)}
              </span>
            </span>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
