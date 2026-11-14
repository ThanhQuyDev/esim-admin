'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

const noSubscribe = () => () => {};

/** True once in the browser: the big lists are not rendered on the server. */
export function inBrowserSnapshot() {
  return true;
}
export function onServerSnapshot() {
  return false;
}
export { noSubscribe };

/**
 * What a big list says while it changes page (vande-0411 #054): a bar while the
 * new rows are coming, and a way out when they do not. Without it the old rows
 * sat there looking final, and a failed request looked the same as a slow one.
 */
export function ListLoadState({
  loading,
  failed,
  onRetry
}: {
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  if (failed) {
    return (
      <div
        className='border-destructive/40 bg-destructive/5 text-destructive mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm'
        role='alert'
        data-testid='list-load-failed'
      >
        Không tải được danh sách, có thể do mạng hoặc máy chủ đang bận.
        <Button variant='outline' size='sm' onClick={onRetry}>
          <Icons.spinner />
          Thử lại
        </Button>
      </div>
    );
  }
  return <LoadingNote loading={loading} />;
}

/**
 * A small "Đang tải…" in a space kept for it, shown only when a load lasts
 * (vande-1411 #013): the bar across the table that came and went with every
 * search and filter looked like a flicker. Nothing moves around it.
 */
function LoadingNote({ loading }: { loading: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!loading) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), 400);
    return () => clearTimeout(timer);
  }, [loading]);
  return (
    <div className='mb-1 flex h-4 items-center justify-end' aria-live='polite'>
      {show && (
        <span
          className='text-muted-foreground flex items-center gap-1 text-xs'
          data-testid='list-loading'
        >
          <Icons.spinner className='size-3 animate-spin' />
          Đang tải…
        </span>
      )}
    </div>
  );
}
