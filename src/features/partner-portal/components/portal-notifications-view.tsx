'use client';

/**
 * The partner's notifications page (doitac-1410 #016): "Tất cả / Chưa đọc /
 * Đã đọc", laid out like the admin console's notifications page. Opening one
 * shows it in full and marks it read, exactly as from the bell.
 */

import { noticePreview } from '@/lib/notice-banner';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { formatDateTimeVn } from '@/lib/format';
import { cn } from '@/lib/utils';

import { markAllNotificationsReadMutation } from '../api/mutations';
import { myAllNotificationsQueryOptions } from '../api/queries';
import type { MyNotification } from '../api/types';
import { NotificationDialog, useOpenNotification } from './portal-notification-bell';

export function PortalNotificationsView() {
  const { data, isLoading } = useQuery(myAllNotificationsQueryOptions());
  const markAll = useMutation(markAllNotificationsReadMutation);
  const { open, close, show } = useOpenNotification();

  const all = data?.data ?? [];
  const unread = all.filter((n) => !n.isRead);
  const read = all.filter((n) => n.isRead);

  const list = (items: MyNotification[]) => {
    if (isLoading) {
      return (
        <div className='flex justify-center py-16'>
          <Icons.spinner className='size-6 animate-spin' />
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-16'>
          <Icons.notification className='text-muted-foreground/40 mb-3 h-10 w-10' />
          <p className='text-muted-foreground text-sm'>Không có thông báo nào.</p>
        </div>
      );
    }
    // One grey card per notice, as on the admin's notifications page, with a
    // "Xem chi tiết" a partner can find — the whole row being clickable was
    // not obvious enough (doitac-3010 #013).
    return (
      <div className='flex flex-col gap-3'>
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-2xl px-4 py-3.5 transition-colors',
              item.isRead ? 'bg-muted/50' : 'bg-muted'
            )}
            data-testid='portal-notification'
          >
            <div className='flex items-center gap-2'>
              <h3 className='text-[15px] leading-tight font-semibold'>{item.title}</h3>
              {!item.isRead && (
                <span className='h-2 w-2 shrink-0 rounded-full bg-sky-500' aria-label='Chưa đọc' />
              )}
              {!item.isRead && <Badge variant='destructive'>Mới</Badge>}
            </div>
            <p className='text-muted-foreground mt-1.5 line-clamp-2 text-[13px]'>
              {noticePreview(item.body)}
            </p>
            <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
              <span className='text-muted-foreground text-xs'>
                {formatDateTimeVn(item.createdAt)}
              </span>
              <Button
                size='sm'
                variant={item.isRead ? 'outline' : 'default'}
                onClick={() => show(item)}
                data-testid='notification-detail'
              >
                Xem chi tiết
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Tabs defaultValue='all'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <TabsList>
            <TabsTrigger value='all'>Tất cả ({all.length})</TabsTrigger>
            <TabsTrigger value='unread'>Chưa đọc ({unread.length})</TabsTrigger>
            <TabsTrigger value='read'>Đã đọc ({read.length})</TabsTrigger>
          </TabsList>
          {unread.length > 0 && (
            <Button
              variant='outline'
              size='sm'
              isLoading={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
        <TabsContent value='all' className='mt-4'>
          {list(all)}
        </TabsContent>
        <TabsContent value='unread' className='mt-4'>
          {list(unread)}
        </TabsContent>
        <TabsContent value='read' className='mt-4'>
          {list(read)}
        </TabsContent>
      </Tabs>

      {open && <NotificationDialog notification={open} onClose={close} />}
    </>
  );
}
