'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/** Split pasted text on commas, semicolons, spaces and new lines. */
function splitEmails(text: string): string[] {
  return text
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Recipients typed like Gmail's "To" box (vande #087): Enter, a comma or a
 * paste turns the text into chips; Backspace on an empty box removes the last
 * one. A malformed address stays in the box, marked, rather than being sent.
 */
export function EmailChipsInput({
  value,
  onChange,
  max = 1000
}: {
  value: string[];
  onChange: (emails: string[]) => void;
  max?: number;
}) {
  const [draft, setDraft] = useState('');
  const [invalid, setInvalid] = useState<string[]>([]);

  const add = (text: string) => {
    const words = splitEmails(text);
    if (!words.length) return;
    const good = words.filter((w) => EMAIL.test(w));
    const bad = words.filter((w) => !EMAIL.test(w));
    const next = [...new Set([...value, ...good])].slice(0, max);
    if (next.length !== value.length) onChange(next);
    setInvalid(bad);
    setDraft(bad.join(', '));
  };

  return (
    <div className='space-y-1.5'>
      <div
        className={cn(
          'border-input focus-within:ring-ring/50 flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 focus-within:ring-[3px]',
          invalid.length > 0 && 'border-destructive'
        )}
        data-testid='announcement-emails'
      >
        {value.map((email) => (
          <span
            key={email}
            className='bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm'
            data-testid='announcement-email-chip'
          >
            {email}
            <button
              type='button'
              aria-label={`Bỏ ${email}`}
              className='text-muted-foreground hover:text-foreground'
              onClick={() => onChange(value.filter((e) => e !== email))}
            >
              <Icons.close className='h-3 w-3' />
            </button>
          </span>
        ))}
        <input
          className='min-w-[180px] flex-1 bg-transparent py-1 text-sm outline-none'
          placeholder={value.length ? '' : 'vd: an@gmail.com, binh@yahoo.com — Enter để thêm'}
          value={draft}
          aria-label='Email người nhận'
          onChange={(e) => {
            const text = e.target.value;
            // A comma, semicolon or space ends an address.
            if (/[,;\s]$/.test(text)) add(text);
            else {
              setDraft(text);
              setInvalid([]);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(draft);
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            add(`${draft} ${e.clipboardData.getData('text')}`);
          }}
          onBlur={() => add(draft)}
        />
      </div>
      {invalid.length > 0 ? (
        <p className='text-destructive text-xs'>Email không hợp lệ: {invalid.join(', ')}</p>
      ) : (
        <p className='text-muted-foreground text-xs'>
          Dán nhiều email cách nhau bằng dấu phẩy, hoặc gõ từng email rồi nhấn Enter. Gửi được cả
          email chưa có tài khoản.
        </p>
      )}
    </div>
  );
}
