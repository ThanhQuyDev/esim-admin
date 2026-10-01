'use client';

import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { APP_MODE } from '@/config/app-mode';
import {
  defaultAuthPageContent,
  fetchAuthPageContent,
  type AuthPageContent
} from '../api/auth-page-settings';
import { InteractiveGridPattern } from './interactive-grid';

/**
 * Sign-in / sign-up branding from the CMS (#006).
 *
 * `placeholderData` keeps the built-in copy on screen while the request is in
 * flight, and {@link fetchAuthPageContent} never throws — nobody should be kept
 * from signing in because a copy lookup failed.
 */
export function useAuthPageContent(): AuthPageContent {
  const { data } = useQuery({
    queryKey: ['auth-page-content', APP_MODE],
    queryFn: () => fetchAuthPageContent(),
    placeholderData: defaultAuthPageContent(),
    staleTime: 5 * 60_000
  });
  return data ?? defaultAuthPageContent();
}

/**
 * The dark left-hand panel shared by both auth screens. It used to be copied
 * into each of them, still carrying the starter kit's "Logo" mark and a
 * testimonial from "Random Dude" — which partners read on the page where they
 * first meet esim.vn.
 */
export function AuthBrandPanel() {
  const content = useAuthPageContent();

  return (
    <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
      <div className='absolute inset-0 bg-zinc-900' />
      {content.coverImageUrl && (
        // Dimmed, because the logo and the quote sit on top of it.
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={content.coverImageUrl}
          alt=''
          aria-hidden
          className='absolute inset-0 h-full w-full object-cover opacity-40'
        />
      )}
      <div className='relative z-20 flex items-center text-lg font-medium'>
        {content.logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={content.logoUrl}
            alt={content.logoText}
            className='mr-2 h-8 max-w-40 object-contain'
          />
        ) : (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-2 h-6 w-6'
          >
            <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
          </svg>
        )}
        {content.logoText}
      </div>
      {/* The animated grid is the backdrop only when no cover image is set. */}
      {!content.coverImageUrl && (
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
      )}
      <div className='relative z-20 mt-auto'>
        <blockquote className='space-y-2'>
          <p className='text-lg'>&ldquo;{content.quote}&rdquo;</p>
          <footer className='text-sm'>{content.quoteAuthor}</footer>
        </blockquote>
      </div>
    </div>
  );
}
