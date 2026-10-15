'use client';

/**
 * The partner's notifications page (doitac-1410 #016): "Tất cả / Chưa đọc /
 * Đã đọc", laid out like the admin console's notifications page. Opening one
 * shows it in full and marks it read, exactly as from the bell.
 */

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
    return (
      <div className='flex flex-col gap-2'>
        {items.map((item) => (
          <button
            key={item.id}
            type='button'
            onClick={() => show(item)}
            className={cn(
              'hover:bg-muted/50 flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
              !item.isRead && 'border-primary/30 bg-primary/5'
            )}
            data-testid='portal-notification'
          >
            <span
              className={cn(
                'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                item.isRead ? 'bg-transparent' : 'bg-destructive'
              )}
              aria-hidden='true'
            />
            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <p className={cn('text-sm', !item.isRead && 'font-semibold')}>{item.title}</p>
                {!item.isRead && <Badge variant='destructive'>Mới</Badge>}
              </div>
              <p className='text-muted-foreground mt-1 line-clamp-2 text-sm'>{item.body}</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                {formatDateTimeVn(item.createdAt)}
              </p>
            </div>
          </button>
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
