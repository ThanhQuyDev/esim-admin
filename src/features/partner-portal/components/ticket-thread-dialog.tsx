'use client';

/**
 * The conversation on one support ticket (#032).
 *
 * A ticket used to be a one-way form: the partner described the problem and
 * then had nowhere to answer the question support sent back, so the rest of the
 * exchange happened in somebody's inbox and never made it back to the ticket.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { ticketMessagesQueryOptions, partnerPortalKeys } from '../api/queries';
import { replyToTicket, uploadAttachment } from '../api/service';
import type { MyTicket } from '../api/types';

function formatMoment(value: string): string {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

interface TicketThreadDialogProps {
  ticket: MyTicket | null;
  onOpenChange: (open: boolean) => void;
}

export function TicketThreadDialog({ ticket, onOpenChange }: TicketThreadDialogProps) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: messages, isLoading } = useQuery(ticketMessagesQueryOptions(ticket?.id ?? null));

  const reply = useMutation({
    mutationFn: () => replyToTicket(ticket!.id, body.trim(), attachments),
    onSuccess: () => {
      setBody('');
      setAttachments([]);
      void queryClient.invalidateQueries({
        queryKey: [...partnerPortalKeys.all, 'ticket-messages', ticket?.id ?? 0]
      });
      void queryClient.invalidateQueries({ queryKey: partnerPortalKeys.all });
      toast.success('Đã gửi phản hồi.');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  return (
    <Dialog open={Boolean(ticket)} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            #{ticket?.id} · {ticket?.subject}
          </DialogTitle>
          <DialogDescription>
            Trao đổi trực tiếp tại đây; mọi phản hồi cũng được gửi tới email của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* The original request opens the thread, so the reply above it has
              something to refer to. */}
          <div className='rounded-lg border p-3'>
            <div className='mb-1 flex items-center gap-2'>
              <Badge variant='secondary'>Bạn</Badge>
              <span className='text-muted-foreground text-xs'>
                {ticket && formatMoment(ticket.createdAt)}
              </span>
            </div>
            <p className='text-sm whitespace-pre-wrap'>{ticket?.description}</p>
          </div>

          {isLoading && (
            <p className='text-muted-foreground py-4 text-center text-sm'>Đang tải trao đổi…</p>
          )}

          {(messages ?? []).map((message) => {
            const fromSupport = message.authorRole === 'admin';
            return (
              <div
                key={message.id}
                className={cn(
                  'rounded-lg border p-3',
                  fromSupport && 'bg-muted/50 border-transparent'
                )}
              >
                <div className='mb-1 flex flex-wrap items-center gap-2'>
                  <Badge variant={fromSupport ? 'default' : 'secondary'}>
                    {fromSupport ? 'Hỗ trợ esim.vn' : 'Bạn'}
                  </Badge>
                  {message.authorName && fromSupport && (
                    <span className='text-muted-foreground text-xs'>{message.authorName}</span>
                  )}
                  <span className='text-muted-foreground text-xs'>
                    {formatMoment(message.createdAt)}
                  </span>
                </div>
                <p className='text-sm whitespace-pre-wrap'>{message.body}</p>
                {message.attachments?.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target='_blank'
                    rel='noreferrer'
                    className='mt-2 block text-xs underline underline-offset-4'
                  >
                    Tài liệu đính kèm
                  </a>
                ))}
              </div>
            );
          })}

          {!isLoading && (messages ?? []).length === 0 && (
            <p className='text-muted-foreground text-center text-sm'>
              Chưa có phản hồi nào. Bạn có thể bổ sung thông tin ngay dưới đây.
            </p>
          )}

          <div className='space-y-2'>
            <Textarea
              rows={3}
              placeholder='Bổ sung thông tin hoặc trả lời đội hỗ trợ…'
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex flex-wrap items-center gap-2'>
                <input
                  id='ticketAttachment'
                  type='file'
                  className='hidden'
                  accept='image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setUploading(true);
                    try {
                      const url = await uploadAttachment(file);
                      setAttachments((current) => [...current, url]);
                    } catch (error) {
                      toast.error((error as Error).message);
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                <Button size='sm' variant='outline' asChild disabled={uploading}>
                  <label htmlFor='ticketAttachment' className='cursor-pointer'>
                    {uploading ? 'Đang tải tệp…' : 'Đính kèm tài liệu'}
                  </label>
                </Button>
                {attachments.length > 0 && (
                  <span className='text-muted-foreground text-xs'>
                    {attachments.length} tệp đã đính kèm
                  </span>
                )}
              </div>
              <Button
                size='sm'
                isLoading={reply.isPending}
                disabled={!body.trim()}
                onClick={() => reply.mutate()}
              >
                Gửi phản hồi
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
