'use client';

/**
 * Compose an announcement to partners, and see what has been sent (#079).
 *
 * The bell is the delivery that always happens; the email is an extra the
 * admin opts into, because most announcements do not warrant one and a
 * partner's inbox is not ours to fill.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { formatDateTimeVn } from '@/lib/format';

import { createNotificationMutation } from '../api/mutations';
import { notificationsQueryOptions } from '../api/queries';

const AUDIENCES = [
  { value: 'all', label: 'Toàn bộ đối tác' },
  { value: 'kol', label: 'Đối tác tiếp thị' },
  { value: 'distribution', label: 'Đối tác phân phối' }
];

const AUDIENCE_LABEL: Record<string, string> = Object.fromEntries(
  AUDIENCES.map((a) => [a.value, a.label])
);

const TITLE_LIMIT = 200;
const BODY_LIMIT = 5000;

export function PartnerNotificationsView() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [sendEmail, setSendEmail] = useState(false);

  const queryClient = useQueryClient();
  const { data: sent = [], isLoading } = useQuery(notificationsQueryOptions());

  const send = useMutation({
    ...createNotificationMutation,
    onSuccess: (created) => {
      toast.success(
        created.sendEmail ? `Đã gửi thông báo và ${created.emailsSent} email.` : 'Đã gửi thông báo.'
      );
      setTitle('');
      setBody('');
      setSendEmail(false);
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message || 'Gửi thông báo thất bại')
  });

  const canSend = title.trim().length > 0 && body.trim().length > 0;

  return (
    <div className='space-y-6'>
      <div className='space-y-4 rounded-lg border p-4'>
        <p className='text-sm font-medium'>Soạn thông báo</p>

        <div className='space-y-1.5'>
          <Label htmlFor='notification-title'>Tiêu đề</Label>
          <Input
            id='notification-title'
            value={title}
            maxLength={TITLE_LIMIT}
            placeholder='VD: Bảo trì hệ thống ngày 05/10'
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className='text-muted-foreground text-right text-xs'>
            {title.length}/{TITLE_LIMIT}
          </p>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='notification-body'>Nội dung</Label>
          <Textarea
            id='notification-body'
            value={body}
            maxLength={BODY_LIMIT}
            rows={6}
            placeholder='Nội dung đầy đủ đối tác sẽ đọc khi bấm xem chi tiết.'
            onChange={(e) => setBody(e.target.value)}
          />
          <p className='text-muted-foreground text-right text-xs'>
            {body.length}/{BODY_LIMIT}
          </p>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='notification-audience'>Gửi tới</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger id='notification-audience'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-muted-foreground text-xs'>
              Chỉ gửi tới các đối tác đang hoạt động — tài khoản bị khoá không nhận thông báo.
            </p>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='notification-email'>Gửi kèm email</Label>
            <div className='flex h-9 items-center'>
              <Switch id='notification-email' checked={sendEmail} onCheckedChange={setSendEmail} />
            </div>
            <p className='text-muted-foreground text-xs'>
              Thông báo luôn hiện ở chuông trong ứng dụng. Bật thêm mục này nếu tin quan trọng tới
              mức cần vào hộp thư của đối tác.
            </p>
          </div>
        </div>

        <div className='flex justify-end'>
          <Button
            disabled={!canSend || send.isPending}
            onClick={() => send.mutate({ title, body, audience, sendEmail })}
          >
            {send.isPending ? 'Đang gửi…' : 'Gửi thông báo'}
          </Button>
        </div>
      </div>

      <div>
        <p className='mb-3 text-sm font-medium'>Đã gửi</p>
        {isLoading ? (
          <div className='flex justify-center py-12'>
            <Icons.spinner className='h-6 w-6 animate-spin' />
          </div>
        ) : sent.length === 0 ? (
          <p className='text-muted-foreground py-12 text-center text-sm'>Chưa gửi thông báo nào.</p>
        ) : (
          <div className='space-y-3'>
            {sent.map((item) => (
              <div key={item.id} className='rounded-lg border p-4'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='font-medium'>{item.title}</span>
                  <Badge variant='outline'>{AUDIENCE_LABEL[item.audience] ?? item.audience}</Badge>
                  {item.sendEmail && (
                    <Badge variant='secondary'>{item.emailsSent} email đã gửi</Badge>
                  )}
                </div>
                <p className='text-muted-foreground mt-1 line-clamp-2 text-sm whitespace-pre-wrap'>
                  {item.body}
                </p>
                <p className='text-muted-foreground mt-2 text-xs'>
                  {formatDateTimeVn(item.createdAt)} · {item.readCount}/{item.recipients} đối tác đã
                  đọc
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
