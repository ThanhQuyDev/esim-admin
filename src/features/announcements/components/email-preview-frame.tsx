'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Icons } from '@/components/icons';

/** The expected sender; anything else means its mailbox is not set up on the server. */
export const ANNOUNCEMENT_SENDER = 'service@esim.com.vn';

/**
 * The email as it will arrive, with a button to read it on the whole screen, wide
 * content included (vande-0411 #059). `sandbox` keeps its links and scripts inert.
 */
export function EmailPreviewFrame({
  html,
  subject,
  className
}: {
  html: string;
  subject: string;
  className?: string;
}) {
  const [full, setFull] = useState(false);
  return (
    <div className='relative'>
      <Button
        type='button'
        size='sm'
        variant='secondary'
        className='absolute top-2 right-2 z-10 shadow-sm'
        onClick={() => setFull(true)}
        data-testid='email-preview-fullscreen'
      >
        <Icons.maximize className='mr-1 h-4 w-4' /> Toàn màn hình
      </Button>
      <iframe
        title='Xem trước email'
        sandbox=''
        srcDoc={html}
        className={className ?? 'h-[640px] w-full bg-[#f5f5f5]'}
      />
      <Dialog open={full} onOpenChange={setFull}>
        <DialogContent
          className='flex h-[100dvh] max-h-none w-screen max-w-none flex-col gap-2 rounded-none p-3 sm:max-w-none'
          data-testid='email-preview-full'
        >
          <DialogHeader>
            <DialogTitle className='truncate pr-8 text-base'>
              {subject || '(Chưa có tiêu đề)'}
            </DialogTitle>
          </DialogHeader>
          <iframe
            title='Xem trước email, toàn màn hình'
            sandbox=''
            srcDoc={html}
            className='min-h-0 w-full flex-1 rounded border bg-[#f5f5f5]'
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Said plainly when announcements would not leave from service@. */
export function SenderWarning({ from }: { from?: string }) {
  if (!from || from === ANNOUNCEMENT_SENDER) return null;
  return (
    <p
      className='rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200'
      data-testid='announcement-sender-warning'
    >
      Máy chủ chưa cấu hình hộp thư {ANNOUNCEMENT_SENDER} (biến MAIL_SERVICE_*), email đang gửi từ{' '}
      {from}.
    </p>
  );
}
