'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { SubmitManualOrderDialog } from './submit-manual-order-dialog';
import { BulkOrderDialog } from './bulk-order-dialog';
import { toast } from 'sonner';
import { exportOrdersExcel } from '../api/service';
import { useOrderListFilters } from './orders-table/use-order-list-filters';

/**
 * "Xuất Excel đối soát", left of "Đặt eSIM hàng loạt" (vande-1411 #044). It
 * reads the list's URL filters, so the sheet still matches the screen.
 */
function ExportOrdersExcelButton() {
  const { filters } = useOrderListFilters();
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      await exportOrdersExcel(filters);
    } catch (err) {
      toast.error((err as Error).message || 'Xuất Excel thất bại');
    } finally {
      setExporting(false);
    }
  };
  return (
    <Button
      size='sm'
      variant='outline'
      onClick={handleExport}
      disabled={exporting}
      data-testid='orders-export-excel'
    >
      {exporting ? (
        <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
      ) : (
        <Icons.download className='mr-2 h-4 w-4' />
      )}
      Xuất Excel đối soát
    </Button>
  );
}

export function SubmitManualOrderTrigger() {
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  return (
    <div className='flex flex-wrap gap-2'>
      <ExportOrdersExcelButton />
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
