'use client';

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
  return (
    <div className='mb-1 h-0.5 overflow-hidden rounded' aria-hidden='true'>
      {loading && (
        <div className='bg-primary h-full w-full animate-pulse' data-testid='list-loading' />
      )}
    </div>
  );
}
