'use client';

import { AttachmentsGrid } from './attachments-grid';
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
import { uploadAttachment } from '@/features/partner-portal/api/service';

/** Files one reply may carry (vande-1411 #034). */
const MAX_REPLY_FILES = 5;
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
  customerEmail,
  fromPartner = false
}: {
  ticketId: number;
  ticketNumber: string | null;
  customerEmail: string;
  /** Opened by a partner: their messages read "Đối tác" (#042, test round 4). */
  fromPartner?: boolean;
}) {
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: messages, isLoading } = useQuery(ticketMessagesQueryOptions(ticketId));

  const { mutate: sendReply, isPending } = useMutation({
    ...replyToTicketMutation,
    onSuccess: () => {
      toast.success(`Đã gửi phản hồi và email tới ${customerEmail}`);
      setBody('');
      setFiles([]);
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
                    {message.authorRole === 'admin'
                      ? 'Hỗ trợ'
                      : fromPartner
                        ? 'Đối tác'
                        : 'Khách hàng'}
                  </Badge>
                  {message.authorName && (
                    <span className='text-sm font-medium'>{message.authorName}</span>
                  )}
                  <span className='text-muted-foreground text-xs'>
                    {formatDateTimeVn(message.createdAt)}
                  </span>
                </div>
                <p className='text-sm whitespace-pre-wrap break-words'>{message.body}</p>
                {/* Files the partner or customer sent with a reply, which the
                    admin could not open before (doitac-3010 #006). */}
                {(message.attachments?.length ?? 0) > 0 && (
                  <AttachmentsGrid attachments={message.attachments} className='mt-2' />
                )}
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
          {/* Files with the reply: shown in the thread and attached to the
              email to the customer or partner (vande-1411 #034). */}
          <input
            id={`ticket-reply-file-${ticketId}`}
            type='file'
            className='hidden'
            accept='image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'
            data-testid='ticket-reply-file'
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setUploading(true);
              try {
                const url = await uploadAttachment(file);
                setFiles((current) => [...current, { name: file.name, url }]);
              } catch (err) {
                toast.error((err as Error).message || 'Không tải được tệp lên.');
              } finally {
                setUploading(false);
              }
            }}
          />
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              asChild
              disabled={uploading || files.length >= MAX_REPLY_FILES}
            >
              <label
                htmlFor={`ticket-reply-file-${ticketId}`}
                className='cursor-pointer'
                data-testid='ticket-reply-attach'
              >
                <Icons.upload className='mr-2 h-4 w-4' />
                {uploading ? 'Đang tải tệp…' : 'Đính kèm tệp'}
              </label>
            </Button>
            <span className='text-muted-foreground text-xs'>
              Ảnh, PDF, Word, Excel — tối đa {MAX_REPLY_FILES} tệp, gửi kèm email.
            </span>
          </div>
          {files.length > 0 && (
            <ul className='space-y-1' data-testid='ticket-reply-files'>
              {files.map((f, i) => (
                <li
                  key={f.url}
                  className='flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-xs'
                >
                  <span className='truncate'>{f.name}</span>
                  <button
                    type='button'
                    className='text-muted-foreground hover:text-destructive shrink-0'
                    aria-label={`Bỏ ${f.name}`}
                    onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                  >
                    <Icons.close className='size-3.5' />
                  </button>
                </li>
              ))}
            </ul>
          )}
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
              disabled={(!trimmed && files.length === 0) || isPending || uploading}
              onClick={() =>
                sendReply({
                  id: ticketId,
                  body: trimmed,
                  attachments: files.map((f) => f.url)
                })
              }
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
