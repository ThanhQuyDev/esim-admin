'use client';

/**
 * The same announcements, on the admin's own header (#079).
 *
 * The brief asks for it explicitly: an admin should see what partners were
 * told without going looking for it, so a support call about "thông báo hôm
 * qua" does not start with somebody opening a different page.
 *
 * Read state is per-partner and an admin is not a partner, so there are no
 * unread dots here — this is a record of what went out, not an inbox.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { formatDateTimeVn } from '@/lib/format';

import { notificationsQueryOptions } from '../api/queries';
import type { PartnerNotification } from '../api/types';

const AUDIENCE_LABEL: Record<string, string> = {
  all: 'Toàn bộ đối tác',
  kol: 'Đối tác tiếp thị',
  distribution: 'Đối tác phân phối'
};

export function AdminNotificationBell() {
  const { data = [] } = useQuery(notificationsQueryOptions());
  const [open, setOpen] = useState<PartnerNotification | null>(null);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='ghost' size='icon' className='relative h-8 w-8'>
            <Icons.notification className='h-4 w-4' />
            <span className='sr-only'>Thông báo đã gửi đối tác</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align='end'
          className='w-[calc(100vw-2rem)] p-0 sm:w-[380px]'
          sideOffset={8}
        >
          <div className='flex items-center justify-between px-4 py-3'>
            <h4 className='text-sm font-semibold'>Thông báo đã gửi đối tác</h4>
            <Link
              href='/dashboard/partners/notifications'
              className='text-muted-foreground text-xs underline underline-offset-4'
            >
              Soạn mới
            </Link>
          </div>
          <ScrollArea className='max-h-[320px]'>
            {data.length === 0 ? (
              <p className='text-muted-foreground px-4 py-8 text-center text-sm'>
                Chưa gửi thông báo nào.
              </p>
            ) : (
              <div className='divide-y'>
                {data.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setOpen(item)}
                    className='hover:bg-muted/50 block w-full px-4 py-3 text-left'
                  >
                    <p className='truncate text-sm font-medium'>{item.title}</p>
                    <p className='text-muted-foreground line-clamp-2 text-xs'>{item.body}</p>
                    <p className='text-muted-foreground mt-1 text-[11px]'>
                      {formatDateTimeVn(item.createdAt)} ·{' '}
                      {AUDIENCE_LABEL[item.audience] ?? item.audience} · {item.readCount}/
                      {item.recipients} đã đọc
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {open && (
        <Dialog open onOpenChange={(next) => !next && setOpen(null)}>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>{open.title}</DialogTitle>
            </DialogHeader>
            <p className='text-muted-foreground text-xs'>
              {formatDateTimeVn(open.createdAt)} · {AUDIENCE_LABEL[open.audience] ?? open.audience}
              {open.sendEmail ? ` · ${open.emailsSent} email đã gửi` : ''}
            </p>
            <div className='text-sm leading-relaxed whitespace-pre-wrap'>{open.body}</div>
            <div className='flex justify-end'>
              <Button variant='outline' onClick={() => setOpen(null)}>
                Đóng
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
