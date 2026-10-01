'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { formatDateTimeVn } from '@/lib/format';
import { replyToTicketMutation } from '../api/mutations';
import { ticketMessagesQueryOptions } from '../api/queries';

/**
 * The conversation on a ticket, and the box an admin replies from (#059).
 *
 * The thread already existed in the API — partners have been able to reply since
 * #032 — but the CMS never showed it, so support had to open their own mail client
 * and compose an answer by hand, with nothing tying it back to the ticket. Sending
 * from here records the reply in the thread AND emails the customer, with the
 * ticket number in the subject line.
 */
export function TicketConversation({
  ticketId,
  ticketNumber,
  customerEmail
}: {
  ticketId: number;
  ticketNumber: string | null;
  customerEmail: string;
}) {
  const [body, setBody] = useState('');

  const { data: messages, isLoading } = useQuery(ticketMessagesQueryOptions(ticketId));

  const { mutate: sendReply, isPending } = useMutation({
    ...replyToTicketMutation,
    onSuccess: () => {
      toast.success(`Đã gửi phản hồi và email tới ${customerEmail}`);
      setBody('');
    },
    onError: (error) => {
      toast.error(error.message || 'Không gửi được phản hồi');
    }
  });

  const trimmed = body.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.chat className='h-4 w-4' />
          Hội thoại
          {ticketNumber && (
            <span className='text-muted-foreground font-mono text-sm font-normal'>
              {ticketNumber}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
          </div>
        ) : (messages?.length ?? 0) === 0 ? (
          <p className='text-muted-foreground text-sm'>
            Chưa có phản hồi nào. Nội dung khách gửi ban đầu ở phần trên.
          </p>
        ) : (
          <div className='space-y-3'>
            {(messages ?? []).map((message) => (
              <div
                key={message.id}
                data-testid={`ticket-message-${message.id}`}
                className={`rounded-lg border p-3 ${
                  message.authorRole === 'admin' ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'
                }`}
              >
                <div className='mb-1 flex flex-wrap items-center gap-2'>
                  <Badge variant={message.authorRole === 'admin' ? 'default' : 'secondary'}>
                    {message.authorRole === 'admin' ? 'Hỗ trợ' : 'Khách hàng'}
                  </Badge>
                  {message.authorName && (
                    <span className='text-sm font-medium'>{message.authorName}</span>
                  )}
                  <span className='text-muted-foreground text-xs'>
                    {formatDateTimeVn(message.createdAt)}
                  </span>
                </div>
                <p className='text-sm whitespace-pre-wrap break-words'>{message.body}</p>
              </div>
            ))}
          </div>
        )}

        <div className='space-y-2 border-t pt-4'>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder='Nhập nội dung phản hồi cho khách hàng...'
            aria-label='Nội dung phản hồi'
            rows={4}
            data-testid='ticket-reply-body'
          />
          <div className='flex flex-wrap items-center justify-between gap-2'>
            {/* Said plainly: this leaves the CMS and reaches the customer, which
                is not obvious from a textarea (#059). */}
            <p className='text-muted-foreground text-xs'>
              Phản hồi sẽ được gửi qua email tới <strong>{customerEmail}</strong>
              {ticketNumber ? ` với mã phiếu ${ticketNumber} ở tiêu đề.` : '.'}
            </p>
            <Button
              type='button'
              size='sm'
              disabled={!trimmed || isPending}
              onClick={() => sendReply({ id: ticketId, body: trimmed })}
              data-testid='ticket-reply-send'
            >
              <Icons.send className='mr-2 h-4 w-4' />
              {isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
