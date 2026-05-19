'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?|#|$)/i;

function getFileName(url: string) {
  try {
    const u = new URL(url, 'http://x');
    const parts = u.pathname.split('/').filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] ?? url);
  } catch {
    return url;
  }
}

function isImage(url: string) {
  return IMAGE_EXT.test(url);
}

interface AttachmentsGridProps {
  attachments: string[] | null;
  className?: string;
}

export function AttachmentsGrid({ attachments, className }: AttachmentsGridProps) {
  if (!attachments || attachments.length === 0) {
    return <p className='text-muted-foreground text-sm'>Không có tệp đính kèm.</p>;
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4', className)}>
      {attachments.map((url, idx) => (
        <AttachmentItem key={`${url}-${idx}`} url={url} />
      ))}
    </div>
  );
}

function AttachmentItem({ url }: { url: string }) {
  const [errored, setErrored] = useState(false);
  const name = getFileName(url);
  const showImage = isImage(url) && !errored;

  return (
    <div className='group bg-muted/30 hover:bg-muted/60 relative flex flex-col overflow-hidden rounded-md border transition'>
      <a
        href={url}
        target='_blank'
        rel='noopener noreferrer'
        className='flex aspect-square items-center justify-center overflow-hidden'
        title={name}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={name}
            loading='lazy'
            onError={() => setErrored(true)}
            className='h-full w-full object-cover transition group-hover:scale-105'
          />
        ) : (
          <div className='text-muted-foreground flex flex-col items-center gap-2 p-4 text-center text-xs'>
            <Icons.page className='h-10 w-10' />
            <span className='line-clamp-2 break-all'>{name}</span>
          </div>
        )}
      </a>
      <div className='flex items-center justify-between gap-2 border-t bg-background/80 px-2 py-1 text-xs'>
        <span className='truncate' title={name}>
          {name}
        </span>
        <a
          href={url}
          download
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary inline-flex shrink-0 items-center gap-0.5 hover:underline'
          aria-label={`Tải xuống ${name}`}
        >
          <Icons.upload className='h-3 w-3 rotate-180' />
          Tải
        </a>
      </div>
    </div>
  );
}
