'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';

/**
 * A customer's email and phone in an order or an eSIM (vande-2011 #021): a
 * chat icon beside the email opens the conversation with that person in a new
 * tab (it is created if they never chatted), the email copies on a click and
 * the phone number calls. Finding a chat used to mean copying the email into
 * the chat search.
 */
export function UserEmail({ userId, email }: { userId?: number | null; email?: string | null }) {
  if (!email) return <>—</>;
  return (
    <span className='inline-flex min-w-0 items-center gap-1.5'>
      <button
        type='button'
        className='min-w-0 truncate text-left hover:underline'
        title='Bấm để copy email'
        data-testid='user-email-copy'
        onClick={() => {
          void navigator.clipboard?.writeText(email).then(
            () => toast.success('Đã copy email'),
            () => toast.error('Không copy được email')
          );
        }}
      >
        {email}
      </button>
      <Icons.copy className='text-muted-foreground h-3.5 w-3.5 shrink-0' aria-hidden='true' />
      {userId ? (
        <Link
          href={`/dashboard/chat?userId=${userId}`}
          target='_blank'
          rel='noopener'
          className='text-primary hover:bg-muted inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full'
          title='Trò chuyện với người dùng này'
          aria-label='Trò chuyện với người dùng này'
          data-testid='user-chat-link'
        >
          <Icons.chat className='h-4 w-4' />
        </Link>
      ) : null}
    </span>
  );
}

/** A phone number that calls when tapped. */
export function UserPhone({ phone }: { phone?: string | null }) {
  const value = phone?.trim();
  if (!value) return <>—</>;
  return (
    <a
      href={`tel:${value.replace(/[^\d+]/g, '')}`}
      className='inline-flex items-center gap-1.5 hover:underline'
      title='Bấm để gọi'
      data-testid='user-phone-call'
    >
      <Icons.phone className='text-muted-foreground h-3.5 w-3.5' aria-hidden='true' />
      {value}
    </a>
  );
}
