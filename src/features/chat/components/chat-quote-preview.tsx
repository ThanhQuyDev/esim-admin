'use client';

import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { ChatMessageQuote } from '../api/types';

/**
 * One-line summary of a quoted message (#073).
 *
 * A message that is only an attachment has no useful text — `sendMessage`
 * stores the placeholder "📎" for those — so the quote falls back to the file
 * name, which is what the admin actually recognises.
 */
export function quoteSummary(quote: Pick<ChatMessageQuote, 'message' | 'fileName' | 'fileType'>) {
  const text = quote.message?.trim();
  if (text && text !== '📎') return text;
  if (quote.fileType?.startsWith('image/')) return quote.fileName || 'Hình ảnh';
  if (quote.fileType?.startsWith('video/')) return quote.fileName || 'Video';
  return quote.fileName || 'Tệp đính kèm';
}

interface ChatQuotePreviewProps {
  /** Who wrote the quoted message, already resolved to a display name. */
  authorName: string;
  quote: Pick<ChatMessageQuote, 'message' | 'fileName' | 'fileType'>;
  /** Jump to the original message; omitted in the composer chip. */
  onJump?: () => void;
  /** Drop the quote — only the composer offers this. */
  onCancel?: () => void;
  /** Inverted colours for the admin's own (primary-coloured) bubbles. */
  tone?: 'default' | 'own';
  className?: string;
  'data-testid'?: string;
}

export function ChatQuotePreview({
  authorName,
  quote,
  onJump,
  onCancel,
  tone = 'default',
  className,
  'data-testid': testId
}: ChatQuotePreviewProps) {
  const isOwn = tone === 'own';
  const summary = quoteSummary(quote);

  const body = (
    <>
      <span
        className={cn(
          'block truncate text-[0.7rem] font-semibold',
          isOwn ? 'text-primary-foreground/90' : 'text-foreground/70'
        )}
      >
        {authorName}
      </span>
      <span
        className={cn(
          'block truncate text-[0.72rem]',
          isOwn ? 'text-primary-foreground/75' : 'text-muted-foreground'
        )}
      >
        {summary}
      </span>
    </>
  );

  return (
    <div
      data-testid={testId}
      className={cn(
        'flex items-center gap-2 rounded-lg border-l-2 py-1 pr-1 pl-2',
        isOwn ? 'border-primary-foreground/60 bg-black/10' : 'border-primary/60 bg-muted/60',
        className
      )}
    >
      {onJump ? (
        <button
          type='button'
          onClick={onJump}
          className='min-w-0 flex-1 cursor-pointer text-left'
          title={`Xem tin nhắn gốc của ${authorName}`}
        >
          {body}
        </button>
      ) : (
        <div className='min-w-0 flex-1'>{body}</div>
      )}

      {onCancel && (
        <button
          type='button'
          onClick={onCancel}
          data-testid='chat-reply-cancel'
          className='text-muted-foreground hover:text-foreground shrink-0 rounded-full p-1 transition'
          aria-label='Hủy trả lời tin nhắn này'
        >
          <Icons.close className='h-3.5 w-3.5' />
        </button>
      )}
    </div>
  );
}
