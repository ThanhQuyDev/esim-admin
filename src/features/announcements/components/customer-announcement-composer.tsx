'use client';

/**
 * "Soạn thông báo gửi khách hàng" (vande #072): the email on the left, as it
 * will arrive on the right — rendered by the backend through the same
 * template it sends with, so the preview cannot drift from the real thing.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { TiptapEditor } from '@/components/tiptap-editor';
import { uploadToCloudinary } from '@/features/blogs/api/service';
import { formatDateTimeVn } from '@/lib/format';
import { formatSpan } from '@/lib/format-span';
import { cn } from '@/lib/utils';

import { announcementKeys, audienceCountQueryOptions } from '../api/queries';
import { createCustomerAnnouncement, previewCustomerAnnouncement } from '../api/service';
import type { AnnouncementAudience, AnnouncementPeriod } from '../api/types';
import { AUDIENCE_OPTIONS, PERIOD_OPTIONS } from '../constants';

const SENDER = 'service@esim.com.vn';
const SUBJECT_LIMIT = 200;

/** The value as it changes, once it has stopped changing for `ms`. */
function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `datetime-local` value for a moment, in the browser's own time. */
function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/** Tomorrow at 9:00 — a sensible first suggestion for a scheduled send. */
function suggestedSchedule(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return toLocalInput(date);
}

export function CustomerAnnouncementComposer() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [audience, setAudience] = useState<AnnouncementAudience>('purchased');
  const [period, setPeriod] = useState<AnnouncementPeriod>('last_30_days');
  const [intervalSec, setIntervalSec] = useState('10');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [draftSchedule, setDraftSchedule] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: count, isFetching: counting } = useQuery(
    audienceCountQueryOptions(audience, period)
  );
  const recipients = count?.recipients ?? 0;

  // The preview follows the text once typing pauses.
  const previewInput = useDebounced({ subject, body }, 500);
  const { data: preview } = useQuery({
    queryKey: [...announcementKeys.all, 'preview', previewInput],
    queryFn: () => previewCustomerAnnouncement(previewInput),
    placeholderData: (previous) => previous
  });

  const interval = Number(intervalSec);
  const intervalOk = Number.isInteger(interval) && interval >= 0 && interval <= 3600;
  const bodyText = body.replace(/<[^>]+>/g, '').trim();
  const hasImage = /<img\b/i.test(body);
  const problem = !subject.trim()
    ? 'Nhập tiêu đề email.'
    : subject.trim().length < 3
      ? 'Tiêu đề cần ít nhất 3 ký tự.'
      : !bodyText && !hasImage
        ? 'Nhập nội dung email.'
        : !intervalOk
          ? 'Số giây giữa 2 email phải từ 0 đến 3600.'
          : recipients === 0
            ? 'Nhóm khách hàng và khoảng thời gian này chưa có ai để gửi.'
            : null;

  const send = useMutation({
    mutationFn: () =>
      createCustomerAnnouncement({
        subject: subject.trim(),
        body,
        audience,
        period,
        intervalSec: interval,
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {})
      }),
    onSuccess: () => {
      toast.success(
        scheduledAt
          ? `Đã đặt lịch gửi lúc ${formatDateTimeVn(new Date(scheduledAt).toISOString())}.`
          : 'Đã bắt đầu gửi thông báo.'
      );
      void queryClient.invalidateQueries({ queryKey: announcementKeys.all });
      router.push('/dashboard/announcements?tab=customer');
    },
    onError: (e: Error) => {
      setConfirmOpen(false);
      toast.error(e.message || 'Gửi thông báo thất bại');
    }
  });

  const scheduleHour = draftSchedule ? new Date(draftSchedule).getHours() : 9;
  const lateHour = scheduleHour < 8 || scheduleHour >= 21;
  const draftInPast = draftSchedule ? new Date(draftSchedule).getTime() < Date.now() : true;
  const totalSeconds = Math.max(0, recipients - 1) * (intervalOk ? interval : 0);

  return (
    <div className='grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2'>
      {/* Left: what the admin writes */}
      <div className='min-w-0 space-y-5 rounded-lg border p-4' data-testid='announcement-form'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='announcement-audience'>Nhóm khách hàng</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as AnnouncementAudience)}>
              <SelectTrigger id='announcement-audience' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-muted-foreground text-xs'>
              {AUDIENCE_OPTIONS.find((o) => o.value === audience)?.hint}
            </p>
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='announcement-period'>Khoảng thời gian</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as AnnouncementPeriod)}>
              <SelectTrigger id='announcement-period' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-muted-foreground text-xs'>
              {audience === 'new'
                ? 'Tính theo ngày khách tạo tài khoản.'
                : audience === 'purchased'
                  ? 'Tính theo ngày đặt đơn thành công.'
                  : 'Tính theo ngày phát sinh đơn lỗi.'}
            </p>
          </div>
        </div>

        <div
          className='bg-muted/40 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm'
          data-testid='announcement-recipients'
        >
          <Icons.user className='h-4 w-4' />
          {counting && !count ? (
            'Đang đếm khách hàng…'
          ) : (
            <span>
              Dự kiến <strong>{recipients.toLocaleString('vi-VN')}</strong> khách hàng nhận
              {recipients > 1 && intervalOk && interval > 0 && (
                <span className='text-muted-foreground'>
                  {' '}
                  · gửi hết khoảng {formatSpan(totalSeconds * 1000)}
                </span>
              )}
            </span>
          )}
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='announcement-interval'>Số giây giữa 2 email</Label>
            <Input
              id='announcement-interval'
              type='number'
              min={0}
              max={3600}
              value={intervalSec}
              onChange={(e) => setIntervalSec(e.target.value)}
            />
            <p className='text-muted-foreground text-xs'>
              Gửi giãn cách để hộp thư không bị đánh dấu spam. Nên từ 5–30 giây.
            </p>
          </div>
          <div className='space-y-1.5'>
            <Label>Thời gian gửi</Label>
            <div className='flex flex-wrap gap-2' role='radiogroup' aria-label='Thời gian gửi'>
              <Button
                type='button'
                variant={scheduledAt ? 'outline' : 'default'}
                size='sm'
                role='radio'
                aria-checked={!scheduledAt}
                data-testid='send-now'
                onClick={() => setScheduledAt(null)}
              >
                Gửi ngay
              </Button>
              <Button
                type='button'
                variant={scheduledAt ? 'default' : 'outline'}
                size='sm'
                role='radio'
                aria-checked={Boolean(scheduledAt)}
                data-testid='send-later'
                onClick={() => {
                  setDraftSchedule(scheduledAt ?? suggestedSchedule());
                  setScheduleOpen(true);
                }}
              >
                <Icons.calendar className='mr-1 h-4 w-4' /> Đặt lịch gửi sau
              </Button>
            </div>
            {scheduledAt && (
              <p className='text-xs' data-testid='scheduled-at'>
                Gửi lúc <strong>{formatDateTimeVn(new Date(scheduledAt).toISOString())}</strong>{' '}
                <button
                  type='button'
                  className='text-primary underline'
                  onClick={() => {
                    setDraftSchedule(scheduledAt);
                    setScheduleOpen(true);
                  }}
                >
                  Đổi
                </button>
              </p>
            )}
          </div>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='announcement-subject'>Tiêu đề</Label>
          <Input
            id='announcement-subject'
            value={subject}
            maxLength={SUBJECT_LIMIT}
            placeholder='VD: Ưu đãi eSIM du lịch tháng 11 dành riêng cho bạn'
            onChange={(e) => setSubject(e.target.value)}
          />
          <p className='text-muted-foreground text-right text-xs'>
            {subject.length}/{SUBJECT_LIMIT}
          </p>
        </div>

        <div className='space-y-1.5'>
          <Label>Nội dung</Label>
          <div data-testid='announcement-body'>
            <TiptapEditor
              content={body}
              onChange={setBody}
              placeholder='Nội dung email gửi khách hàng…'
              onImageUpload={uploadToCloudinary}
            />
          </div>
        </div>

        {problem && <p className='text-muted-foreground text-sm'>{problem}</p>}

        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/announcements?tab=customer')}
          >
            Hủy
          </Button>
          <Button
            disabled={Boolean(problem) || send.isPending}
            data-testid='announcement-send'
            onClick={() => setConfirmOpen(true)}
          >
            <Icons.send className='mr-2 h-4 w-4' />
            {scheduledAt ? 'Đặt lịch gửi' : 'Gửi'}
          </Button>
        </div>
      </div>

      {/* Right: the email as the customer will get it */}
      <div className='min-w-0 xl:sticky xl:top-4 xl:self-start'>
        <div className='overflow-hidden rounded-lg border' data-testid='announcement-preview'>
          <div className='bg-muted/60 space-y-0.5 border-b px-4 py-3 text-sm'>
            <p className='text-muted-foreground text-xs'>Xem trước email khách hàng nhận</p>
            <p className='truncate'>
              <span className='text-muted-foreground'>Từ: </span>ESIM.VN &lt;{SENDER}&gt;
            </p>
            <p className='truncate'>
              <span className='text-muted-foreground'>Tiêu đề: </span>
              <span className={cn(!subject && 'text-muted-foreground italic')}>
                {subject || '(Chưa có tiêu đề)'}
              </span>
            </p>
          </div>
          <iframe
            title='Xem trước email'
            sandbox=''
            srcDoc={preview?.html ?? ''}
            className='h-[640px] w-full bg-[#f5f5f5]'
          />
        </div>
      </div>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Đặt lịch gửi</DialogTitle>
            <DialogDescription>
              Chọn ngày giờ gửi. Nên tránh khung giờ muộn để không làm phiền khách hàng.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='announcement-schedule'>Ngày giờ gửi</Label>
            <Input
              id='announcement-schedule'
              type='datetime-local'
              value={draftSchedule}
              min={toLocalInput(new Date())}
              onChange={(e) => setDraftSchedule(e.target.value)}
            />
            {draftInPast ? (
              <p className='text-destructive text-xs'>Chọn một thời điểm trong tương lai.</p>
            ) : lateHour ? (
              <p className='text-xs text-amber-700 dark:text-amber-400'>
                Giờ này khá muộn/sớm — khách có thể thấy phiền. Nên gửi trong khoảng 8:00–21:00.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setScheduleOpen(false)}>
              Hủy
            </Button>
            <Button
              disabled={draftInPast}
              data-testid='schedule-confirm'
              onClick={() => {
                setScheduledAt(draftSchedule);
                setScheduleOpen(false);
              }}
            >
              Chọn giờ này
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{scheduledAt ? 'Đặt lịch gửi thông báo?' : 'Gửi thông báo?'}</DialogTitle>
            <DialogDescription>
              “{subject.trim()}” tới khoảng {recipients.toLocaleString('vi-VN')} khách hàng (
              {AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label.toLowerCase()},{' '}
              {PERIOD_OPTIONS.find((o) => o.value === period)?.label.toLowerCase()}), mỗi email cách
              nhau {interval} giây
              {scheduledAt
                ? `, bắt đầu lúc ${formatDateTimeVn(new Date(scheduledAt).toISOString())}.`
                : ', bắt đầu ngay.'}{' '}
              Danh sách khách hàng được chốt lúc bắt đầu gửi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConfirmOpen(false)}>
              Hủy
            </Button>
            <Button
              disabled={send.isPending}
              data-testid='announcement-confirm'
              onClick={() => send.mutate()}
            >
              {send.isPending ? 'Đang gửi…' : scheduledAt ? 'Đặt lịch' : 'Gửi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
