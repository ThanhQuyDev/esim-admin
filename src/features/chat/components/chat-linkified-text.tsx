'use client';

import { cn } from '@/lib/utils';
import { splitLinks } from '../utils/linkify';

/** Message text with its URLs clickable, opening in a new tab (#050). */
export function ChatLinkifiedText({
  text,
  linkClassName
}: {
  text: string;
  linkClassName?: string;
}) {
  return (
    <>
      {splitLinks(text).map((part, index) =>
        part.type === 'link' ? (
          <a
            key={index}
            href={part.value}
            target='_blank'
            rel='noopener noreferrer'
            className={cn('break-all underline underline-offset-2', linkClassName)}
          >
            {part.value}
          </a>
        ) : (
          <span key={index}>{part.value}</span>
        )
      )}
    </>
  );
}
