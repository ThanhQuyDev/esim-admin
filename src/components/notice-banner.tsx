'use client';

/**
 * The "nổi bật" announcements at the top of the page (doitac-1410 #062), for
 * partners and admins alike.
 *
 * The colour says how much it matters — blue for normal, amber for
 * important, red for urgent. Several take turns, sliding in every few seconds
 * (paused while the pointer is on it). "x" or "Xem chi tiết" closes one for
 * the rest of this sign-in.
 */

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { SafeHtml } from '@/features/tickets/components/safe-html';
import {
  dismissNotice,
  isHtmlBody,
  noticePreview,
  readDismissedNotices,
  type NoticePriority
} from '@/lib/notice-banner';
import { cn } from '@/lib/utils';

export type BannerNotice = {
  id: number;
  title: string;
  body: string;
  priority?: string | null;
};

const TONE: Record<NoticePriority, { box: string; icon: string; button: string; label: string }> = {
  normal: {
    box: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-100',
    icon: 'text-blue-700 dark:text-blue-300',
    button:
      'border-blue-300 bg-white text-blue-900 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
    label: 'Thông báo'
  },
  important: {
    box: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-100',
    icon: 'text-amber-700 dark:text-amber-300',
    button:
      'border-amber-300 bg-white text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
    label: 'Quan trọng'
  },
  urgent: {
    box: 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100',
    icon: 'text-red-700 dark:text-red-300',
    button:
      'border-red-300 bg-white text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
    label: 'Khẩn cấp'
  }
};

export const toneOf = (priority?: string | null) =>
  TONE[(priority as NoticePriority) in TONE ? (priority as NoticePriority) : 'normal'];

const ROTATE_MS = 6000;

export function NoticeBanner({
  notices,
  onOpen
}: {
  notices: BannerNotice[];
  onOpen: (notice: BannerNotice) => void;
}) {
  // Read after mount: the browser's list is not there on the server.
  const [dismissed, setDismissed] = useState<number[] | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => setDismissed(readDismissedNotices()), []);

  const visible = useMemo(
    () => (dismissed ? notices.filter((n) => !dismissed.includes(n.id)) : []),
    [notices, dismissed]
  );
  const current = visible.length ? visible[index % visible.length] : null;

  useEffect(() => {
    if (visible.length < 2 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % visible.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [visible.length, paused]);

  if (!current) return null;
  const tone = toneOf(current.priority);
  const close = (id: number) => setDismissed(dismissNotice(id));

  return (
    <div
      className={cn('relative overflow-hidden rounded-lg border p-3 pr-10', tone.box)}
      role='status'
      data-testid='notice-banner'
      data-priority={current.priority ?? 'normal'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        key={current.id}
        className='animate-in fade-in slide-in-from-right-4 flex flex-wrap items-center gap-x-3 gap-y-2 duration-500'
      >
        <Icons.notification className={cn('h-4 w-4 shrink-0', tone.icon)} />
        <span className='text-xs font-semibold tracking-wide uppercase'>{tone.label}</span>
        <span className='text-sm font-semibold' data-testid='notice-banner-title'>
          {current.title}
        </span>
        <span className='line-clamp-1 min-w-0 flex-1 basis-40 text-sm opacity-90'>
          {noticePreview(current.body)}
        </span>
        <Button
          size='sm'
          variant='outline'
          className={tone.button}
          onClick={() => {
            onOpen(current);
            close(current.id);
          }}
        >
          Xem chi tiết
        </Button>
      </div>
      <button
        type='button'
        aria-label='Tắt thông báo'
        className='absolute top-2 right-2 rounded p-1 opacity-70 hover:opacity-100'
        onClick={() => close(current.id)}
      >
        <Icons.close className='h-4 w-4' />
      </button>
      {visible.length > 1 && (
        <div className='mt-2 flex justify-center gap-1.5' data-testid='notice-banner-dots'>
          {visible.map((n, i) => (
            <button
              key={n.id}
              type='button'
              aria-label={`Thông báo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-1.5 rounded-full bg-current transition-all duration-300',
                i === index % visible.length ? 'w-5 opacity-80' : 'w-1.5 opacity-30'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** A body from the rich-text editor, or plain text from before it. */
export function NoticeBody({ body }: { body: string }) {
  return isHtmlBody(body) ? (
    <SafeHtml html={body} className='text-sm' />
  ) : (
    <div className='text-sm leading-relaxed whitespace-pre-wrap'>{body}</div>
  );
}
