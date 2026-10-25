'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { formatDateTimeVn } from '@/lib/format';

import { announcementKeys, customerAnnouncementsQueryOptions } from '../api/queries';
import { cancelCustomerAnnouncement } from '../api/service';
import type { CustomerAnnouncement } from '../api/types';
import { AUDIENCE_LABEL, PERIOD_LABEL } from '../constants';
import { formatSpan } from '@/lib/format-span';

/** The time, moving once a minute so "chờ gửi sau …" counts down. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** "Chờ gửi — sau 2 giờ 10 phút", "Đang gửi 12/40", "Đã gửi" … (vande #072). */
function StatusLabel({ item, now }: { item: CustomerAnnouncement; now: number }) {
  if (item.status === 'scheduled') {
    const left = new Date(item.scheduledAt).getTime() - now;
    return (
      <Badge
        variant='outline'
        className='border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
      >
        <Icons.clock className='mr-1 h-3 w-3' />
        {left > 60_000 ? `Chờ gửi — sau ${formatSpan(left)}` : 'Chờ gửi — sắp gửi'}
      </Badge>
    );
  }
  if (item.status === 'sending') {
    return (
      <Badge
        variant='outline'
        className='border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
      >
        <Icons.spinner className='mr-1 h-3 w-3 animate-spin' />
        Đang gửi {item.sentCount}/{item.recipientCount ?? '…'}
      </Badge>
    );
  }
  if (item.status === 'sent') {
    return (
      <Badge
        variant='outline'
        className='border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      >
        <Icons.check className='mr-1 h-3 w-3' />
        Đã gửi
      </Badge>
    );
  }
  return <Badge variant='secondary'>Đã hủy</Badge>;
}

/** When it went, or is to go, or was called off. */
function when(item: CustomerAnnouncement): string {
  if (item.status === 'scheduled') return `Hẹn gửi lúc ${formatDateTimeVn(item.scheduledAt)}`;
  if (item.status === 'cancelled' && !item.startedAt) {
    return `Hẹn gửi lúc ${formatDateTimeVn(item.scheduledAt)} · đã hủy lúc ${formatDateTimeVn(
      item.finishedAt ?? item.createdAt
    )}`;
  }
  const started = `Bắt đầu gửi ${formatDateTimeVn(item.startedAt ?? item.scheduledAt)}`;
  if (!item.finishedAt) return started;
  return `${started} · ${item.status === 'cancelled' ? 'dừng' : 'xong'} lúc ${formatDateTimeVn(
    item.finishedAt
  )}`;
}

/** "Thông báo khách hàng": what has been sent or is waiting to go (vande #072). */
export function CustomerAnnouncementsList() {
  const now = useNow();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery(customerAnnouncementsQueryOptions());
  const [cancelling, setCancelling] = useState<CustomerAnnouncement | null>(null);

  const cancel = useMutation({
    mutationFn: (id: number) => cancelCustomerAnnouncement(id),
    onSuccess: () => {
      toast.success('Đã hủy thông báo — không gửi thêm email nào.');
      setCancelling(null);
      void queryClient.invalidateQueries({ queryKey: announcementKeys.all });
    },
    onError: (e: Error) => toast.error(e.message || 'Hủy thất bại')
  });

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className='text-muted-foreground py-12 text-center text-sm'>
        Chưa có thông báo nào gửi khách hàng.
      </p>
    );
  }

  return (
    <div className='space-y-3' data-testid='customer-announcements'>
      {items.map((item) => (
        <div
          key={item.id}
          className='rounded-lg border p-4'
          data-testid={`customer-announcement-${item.id}`}
        >
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div className='flex min-w-0 flex-wrap items-center gap-2'>
              <span className='font-medium break-words'>{item.subject}</span>
              <StatusLabel item={item} now={now} />
            </div>
            {(item.status === 'scheduled' || item.status === 'sending') && (
              <Button
                size='sm'
                variant='outline'
                className='text-destructive'
                data-testid={`cancel-announcement-${item.id}`}
                onClick={() => setCancelling(item)}
              >
                <Icons.close className='mr-1 h-4 w-4' /> Hủy gửi
              </Button>
            )}
          </div>
          <div className='mt-2 flex flex-wrap gap-2'>
            <Badge variant='outline'>{AUDIENCE_LABEL[item.audience] ?? item.audience}</Badge>
            <Badge variant='outline'>{PERIOD_LABEL[item.period] ?? item.period}</Badge>
            <Badge variant='outline'>Cách nhau {item.intervalSec} giây</Badge>
          </div>
          <p className='text-muted-foreground mt-2 text-xs'>
            {when(item)}
            {item.recipientCount != null &&
              ` · ${item.sentCount}/${item.recipientCount} khách hàng đã nhận`}
            {item.failedCount > 0 && ` · ${item.failedCount} email gửi lỗi`}
          </p>
        </div>
      ))}

      {cancelling && (
        <Dialog open onOpenChange={(open) => !open && setCancelling(null)}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Hủy gửi thông báo?</DialogTitle>
              <DialogDescription>
                “{cancelling.subject}” sẽ không gửi thêm email nào.
                {cancelling.status === 'sending' &&
                  ` ${cancelling.sentCount} email đã gửi thì không thu hồi được.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={() => setCancelling(null)}>
                Không
              </Button>
              <Button
                variant='destructive'
                disabled={cancel.isPending}
                onClick={() => cancel.mutate(cancelling.id)}
              >
                {cancel.isPending ? 'Đang hủy…' : 'Hủy gửi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
