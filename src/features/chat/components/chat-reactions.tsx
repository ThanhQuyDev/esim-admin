'use client';

import { useEffect, useRef, useState } from 'react';
import { Icons } from '@/components/icons';

/**
 * Emoji and reactions in the chat (vande-1411 #037). The reactions are the
 * backend's list (`CHAT_REACTIONS`); each person keeps one per message.
 */
export const CHAT_REACTIONS = ['👍', '👎', '❤️', '😂', '😮', '😢'];

/** A handful of everyday emoji for the message box. */
export const CHAT_EMOJI = [
  '😀',
  '😁',
  '😂',
  '🤣',
  '😊',
  '😍',
  '😘',
  '😎',
  '🤔',
  '😅',
  '😢',
  '😭',
  '😡',
  '😮',
  '🙏',
  '👍',
  '👎',
  '👏',
  '🙌',
  '💪',
  '❤️',
  '🔥',
  '🎉',
  '✅'
];

/** Close a small popover on an outside click or Escape. */
function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}

/** "❤️ 2  😂 1" under a message; one's own reaction is highlighted. */
export function ReactionBar({
  reactions,
  viewerId,
  onReact,
  tone = 'light'
}: {
  reactions?: Record<string, string> | null;
  viewerId: number | null;
  onReact?: (emoji: string) => void;
  tone?: 'light' | 'dark';
}) {
  if (!reactions || Object.keys(reactions).length === 0) return null;
  const mine = viewerId != null ? reactions[String(viewerId)] : undefined;
  const counts = new Map<string, number>();
  for (const emoji of Object.values(reactions)) counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
  return (
    <div className='mt-1 flex flex-wrap gap-1' data-testid='chat-reactions'>
      {CHAT_REACTIONS.filter((e) => counts.has(e)).map((emoji) => (
        <button
          key={emoji}
          type='button'
          onClick={() => onReact?.(emoji)}
          className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0 text-[12px] leading-5 ${
            mine === emoji
              ? 'border-[#5353ff] bg-[#eef0ff] text-[#3b3bd6]'
              : tone === 'dark'
                ? 'border-white/30 bg-white/15 text-white'
                : 'border-gray-200 bg-white text-gray-600'
          }`}
          aria-pressed={mine === emoji}
          aria-label={`${emoji} ${counts.get(emoji)}`}
        >
          <span>{emoji}</span>
          <span className='tabular-nums'>{counts.get(emoji)}</span>
        </button>
      ))}
    </div>
  );
}

/** The smiley beside a message that opens the six reactions. */
export function ReactionPicker({
  onReact,
  testId
}: {
  onReact: (emoji: string) => void;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className='relative shrink-0'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        data-testid={testId}
        className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-opacity hover:bg-gray-200 hover:text-gray-600 sm:opacity-0 sm:group-hover/message:opacity-100 sm:focus-visible:opacity-100'
        aria-label='Thả cảm xúc'
        title='Thả cảm xúc'
      >
        <Icons.emoji className='h-3.5 w-3.5' />
      </button>
      {open && (
        <div
          role='menu'
          className='absolute top-7 right-0 z-20 flex gap-0.5 rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-lg'
        >
          {CHAT_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type='button'
              role='menuitem'
              onClick={() => {
                onReact(emoji);
                setOpen(false);
              }}
              className='rounded-full px-1 text-lg leading-7 transition-transform hover:scale-125'
              aria-label={`Thả ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** The emoji button of the message box. */
export function EmojiPicker({
  onPick,
  disabled
}: {
  onPick: (emoji: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        // Keep the box focused, as the send button does (vande-1411 #036).
        onPointerDown={(e) => e.preventDefault()}
        disabled={disabled}
        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40'
        aria-label='Chèn emoji'
        aria-expanded={open}
        data-testid='chat-emoji'
      >
        <Icons.emoji className='h-4 w-4' />
      </button>
      {open && (
        <div
          role='menu'
          className='absolute bottom-11 left-0 z-20 grid w-[248px] grid-cols-8 gap-0.5 rounded-xl border border-gray-200 bg-white p-2 shadow-lg'
        >
          {CHAT_EMOJI.map((emoji) => (
            <button
              key={emoji}
              type='button'
              role='menuitem'
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => onPick(emoji)}
              className='rounded-md text-xl leading-8 hover:bg-gray-100'
              aria-label={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
