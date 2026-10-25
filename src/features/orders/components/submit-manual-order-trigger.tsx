'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { SubmitManualOrderDialog } from './submit-manual-order-dialog';
import { BulkOrderDialog } from './bulk-order-dialog';

export function SubmitManualOrderTrigger() {
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  return (
    <div className='flex flex-wrap gap-2'>
      {/* A travel group's list from a file (vande #057). */}
      <Button size='sm' variant='outline' onClick={() => setBulkOpen(true)}>
        <Icons.upload className='mr-2 h-4 w-4' />
        Đặt eSIM hàng loạt
      </Button>
      <Button size='sm' onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        Đặt đơn hộ
      </Button>
      <SubmitManualOrderDialog open={open} onOpenChange={setOpen} />
      <BulkOrderDialog open={bulkOpen} onOpenChange={setBulkOpen} />
    </div>
  );
}
