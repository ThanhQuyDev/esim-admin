'use client';

import { Icons } from '@/components/icons';

export function ChatEmptyState() {
  return (
    <div className='border-border/40 bg-background/80 flex min-h-0 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border p-6 backdrop-blur lg:col-start-2 lg:col-end-3 lg:rounded-3xl'>
      <div className='bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full'>
        <Icons.chat className='text-primary h-8 w-8' />
      </div>
      <div className='text-center'>
        <p className='text-foreground text-base font-semibold'>Select a conversation</p>
        <p className='text-muted-foreground mt-1 text-sm'>
          Choose a conversation from the list to start chatting
        </p>
      </div>
    </div>
  );
}
