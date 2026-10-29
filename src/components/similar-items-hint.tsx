'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icons } from '@/components/icons';
import { findSimilar } from '@/lib/similar-text';

export type SimilarItem = {
  id: number;
  title: string;
  /** HTML allowed: the answer / description as saved. */
  body: string;
  language?: string;
  isActive?: boolean;
};

/**
 * Existing entries that look like the one being typed (vande #084), so an
 * admin opens the one already there instead of adding a near-copy. Clicking
 * one shows what it says.
 */
export function SimilarItemsHint({
  text,
  items,
  noun
}: {
  text: string;
  items: SimilarItem[];
  /** "câu hỏi" / "nội dung" — what the list holds. */
  noun: string;
}) {
  const [debounced, setDebounced] = useState(text);
  const [openId, setOpenId] = useState<number | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(text), 300);
    return () => clearTimeout(timer);
  }, [text]);

  const matches = useMemo(
    () => findSimilar(debounced, items, (item) => item.title),
    [debounced, items]
  );
  if (debounced.trim().length < 4 || matches.length === 0) return null;

  return (
    <div
      className='space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40'
      data-testid='similar-items'
    >
      <p className='flex items-start gap-2 font-medium text-amber-900 dark:text-amber-200'>
        <Icons.alertCircle className='mt-0.5 h-4 w-4 shrink-0' />
        Đã có {matches.length} {noun} gần giống trên hệ thống — bấm để xem, nếu nội dung đã ổn thì
        không cần tạo thêm.
      </p>
      <ul className='space-y-1.5'>
        {matches.map(({ item }) => {
          const isOpen = openId === item.id;
          return (
            <li key={item.id} className='rounded border bg-background'>
              <button
                type='button'
                className='flex w-full items-start gap-2 px-2.5 py-1.5 text-left hover:bg-muted/50'
                onClick={() => setOpenId(isOpen ? null : item.id)}
                data-testid={`similar-item-${item.id}`}
              >
                <Icons.chevronRight
                  className={`mt-0.5 h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
                <span className='flex-1'>
                  {item.title}
                  {item.language && (
                    <span className='text-muted-foreground ml-1.5 text-xs uppercase'>
                      {item.language}
                    </span>
                  )}
                  {item.isActive === false && (
                    <span className='text-muted-foreground ml-1.5 text-xs'>(đang tắt)</span>
                  )}
                </span>
              </button>
              {isOpen && (
                <div
                  className='prose prose-sm text-muted-foreground max-w-none border-t px-3 py-2 dark:prose-invert'
                  data-testid='similar-item-body'
                  // Saved by admins through the same editor; shown as they wrote it.
                  dangerouslySetInnerHTML={{ __html: item.body || '—' }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
