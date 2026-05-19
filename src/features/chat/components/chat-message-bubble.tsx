'use client';

import { Icons } from '@/components/icons';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '../api/types';
import { formatMessageTime } from '../utils/format';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  senderName: string;
}

export function ChatMessageBubble({ message, isOwn, senderName }: ChatMessageBubbleProps) {
  const shouldReduceMotion = useReducedMotion();
  const time = formatMessageTime(message.createdAt);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className='flex flex-col gap-1'
      role='group'
      aria-label={`${senderName} lúc ${time}`}
    >
      <div
        className={cn(
          'relative max-w-[85%] rounded-xl border px-3 py-2 text-xs leading-relaxed sm:max-w-[82%] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm',
          isOwn
            ? 'border-primary/40 bg-primary text-primary-foreground ml-auto'
            : 'bg-muted border-transparent'
        )}
      >
        <p
          className={cn(
            'font-medium sm:text-sm',
            isOwn ? 'text-primary-foreground/80' : 'text-foreground/80'
          )}
        >
          {senderName}
        </p>
        {message.fileUrl && message.fileType?.startsWith('image/') && (
          <a
            href={message.fileUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='mt-2 block overflow-hidden rounded-lg'
            aria-label={`Mở hình ảnh ${message.fileName ?? ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.fileUrl}
              alt={message.fileName ?? 'Hình ảnh đính kèm'}
              className='max-h-64 w-auto max-w-full object-cover'
              loading='lazy'
            />
          </a>
        )}
        {message.fileUrl && message.fileType?.startsWith('video/') && (
          <video
            src={message.fileUrl}
            controls
            preload='metadata'
            className='mt-2 max-h-64 w-full rounded-lg'
            aria-label={message.fileName ?? 'Video đính kèm'}
          />
        )}
        {message.fileUrl &&
          !message.fileType?.startsWith('image/') &&
          !message.fileType?.startsWith('video/') && (
            <a
              href={message.fileUrl}
              target='_blank'
              rel='noopener noreferrer'
              className={cn(
                'mt-2 flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs underline-offset-2 hover:underline',
                isOwn
                  ? 'border-primary-foreground/30 text-primary-foreground'
                  : 'border-border/60 text-foreground'
              )}
            >
              <Icons.page className='h-4 w-4 shrink-0' />
              <span className='truncate'>{message.fileName ?? 'Tệp đính kèm'}</span>
            </a>
          )}
        {message.message && (
          <p
            className={cn(
              'mt-1 text-[0.875rem] sm:text-[0.95rem]',
              isOwn ? 'text-primary-foreground/90' : 'text-foreground/90'
            )}
          >
            {message.message}
          </p>
        )}
        <div className='mt-2 flex items-center justify-end gap-1.5 text-[0.65rem] sm:mt-3 sm:gap-2 sm:text-[0.7rem]'>
          <span className={cn('text-muted-foreground', isOwn && 'text-primary-foreground/80')}>
            {time}
          </span>
          {isOwn && message.isRead && (
            <Icons.checks
              className='text-primary-foreground/80 h-3 w-3 sm:h-3.5 sm:w-3.5'
              aria-label='Đã đọc'
            />
          )}
          {isOwn && !message.isRead && (
            <Icons.check
              className='text-primary-foreground/60 h-3 w-3 sm:h-3.5 sm:w-3.5'
              aria-label='Đã gửi'
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
