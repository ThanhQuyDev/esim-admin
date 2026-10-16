'use client';

/**
 * The bell in the top right, and the banner at the top of the page (#079).
 *
 * Two views of the same announcements: the bell is where a partner goes
 * looking, the banner is what catches them when they were not. The banner
 * shows only the newest unread one, because a stack of five banners is a
 * screen nobody reads.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { NoticeBanner, NoticeBody } from '@/components/notice-banner';
import { formatDateTimeVn } from '@/lib/format';
import { noticePreview } from '@/lib/notice-banner';

import { markAllNotificationsReadMutation, markNotificationReadMutation } from '../api/mutations';
import { myNotificationsQueryOptions } from '../api/queries';
import type { MyNotification } from '../api/types';

/** The full announcement, opened from the bell, the banner or the page. */
export function NotificationDialog({
  notification,
  onClose
}: {
  notification: MyNotification;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{notification.title}</DialogTitle>
        </DialogHeader>
        <p className='text-muted-foreground text-xs'>{formatDateTimeVn(notification.createdAt)}</p>
        {/* Rich text from the admin's editor (doitac-1410 #062). */}
        <NoticeBody body={notification.body} />
        <div className='flex justify-end'>
          <Button variant='outline' onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Shared open-and-mark-read behaviour for the bell, the banner and the page. */
export function useOpenNotification() {
  const [open, setOpen] = useState<MyNotification | null>(null);
  const markRead = useMutation(markNotificationReadMutation);

  return {
    open,
    close: () => setOpen(null),
    show: (notification: MyNotification) => {
      setOpen(notification);
      // Opening it is reading it. The request is idempotent, so firing it
      // again on a second open costs nothing.
      if (!notification.isRead) markRead.mutate(notification.id);
    }
  };
}

export function PortalNotificationBell() {
  const { data } = useQuery(myNotificationsQueryOptions());
  const markAll = useMutation(markAllNotificationsReadMutation);
  const { open, close, show } = useOpenNotification();

  const notifications = data?.data ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='ghost' size='icon' className='relative h-8 w-8'>
            <Icons.notification className='h-4 w-4' />
            {unread > 0 && (
              <span className='bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium'>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
            <span className='sr-only'>Thông báo</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align='end'
          className='w-[calc(100vw-2rem)] p-0 sm:w-[380px]'
          sideOffset={8}
        >
          <div className='flex items-center justify-between px-4 py-3'>
            <h4 className='text-sm font-semibold'>Thông báo</h4>
            {unread > 0 && (
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground h-auto px-2 py-1 text-xs'
                onClick={() => markAll.mutate()}
              >
                Đánh dấu đã đọc
              </Button>
            )}
          </div>
          {/* A plain scrolling box: the ScrollArea's max-height did not clip, so a long list spilled over "Xem tất cả thông báo" (doitac-1410 #016). */}
          <div className='max-h-[320px] overflow-y-auto'>
            {notifications.length === 0 ? (
              <p className='text-muted-foreground px-4 py-8 text-center text-sm'>
                Chưa có thông báo nào.
              </p>
            ) : (
              <div className='divide-y'>
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => show(item)}
                    className='hover:bg-muted/50 block w-full px-4 py-3 text-left'
                  >
                    <div className='flex items-start gap-2'>
                      {!item.isRead && (
                        <span className='bg-destructive mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full' />
                      )}
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-medium'>{item.title}</p>
                        <p className='text-muted-foreground line-clamp-2 text-xs'>
                          {noticePreview(item.body)}
                        </p>
                        <p className='text-muted-foreground mt-1 text-[11px]'>
                          {formatDateTimeVn(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* The whole list, with read and unread apart (doitac-1410 #016). */}
          <div className='border-t p-2'>
            <Button asChild variant='ghost' size='sm' className='w-full'>
              <Link href='/dashboard/portal/notifications'>Xem tất cả thông báo</Link>
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {open && <NotificationDialog notification={open} onClose={close} />}
    </>
  );
}

/**
 * The "nổi bật" announcements at the top of the page (#079, doitac-1410
 * #062): the ones an admin featured, read or not, in the colour of their
 * priority, until the partner closes them for this sign-in.
 */
export function PortalNotificationBanner() {
  const { data } = useQuery(myNotificationsQueryOptions());
  const { open, close, show } = useOpenNotification();
  const featured = data?.featured ?? [];

  return (
    <>
      <NoticeBanner
        notices={featured}
        onOpen={(notice) => {
          const full = featured.find((n) => n.id === notice.id);
          if (full) show(full);
        }}
      />
      {open && <NotificationDialog notification={open} onClose={close} />}
    </>
  );
}
