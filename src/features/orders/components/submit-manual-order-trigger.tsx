'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { SubmitManualOrderDialog } from './submit-manual-order-dialog';

export function SubmitManualOrderTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size='sm' onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        Đặt đơn hộ
      </Button>
      <SubmitManualOrderDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
