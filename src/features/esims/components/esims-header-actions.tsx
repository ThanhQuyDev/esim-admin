'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { exportEsimsExcel } from '../api/service';
import { EsimFormDialog } from './esim-form-dialog';
import { ImportEsimExcelDialog } from './import-esim-excel-dialog';
import { useEsimListFilters } from './esims-table/use-esim-list-filters';

/**
 * The page's buttons, on the title's row in the order asked for (vande-1411
 * #044): Export Excel, Import eSIM Domestic, Import eSIM Travel, and "Thêm
 * eSIM" last. The filters below then fit on one line.
 */
export function EsimsHeaderActions() {
  const { filters } = useEsimListFilters();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportEsimsExcel(filters);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className='flex max-w-[70vw] flex-wrap items-center justify-end gap-2'
      data-testid='esims-header-actions'
    >
      <Button variant='outline' onClick={handleExport} disabled={exporting}>
        {exporting ? <Icons.spinner className='animate-spin' /> : <Icons.download />}
        Export Excel
      </Button>
      {/* Hai nút riêng cho hai loại eSIM của nhà mạng trong nước: eSIM nội
          địa (tab riêng ở trang chủ) và eSIM du lịch (Quốc gia → Việt Nam). */}
      <ImportEsimExcelDialog kind='domestic' />
      <ImportEsimExcelDialog kind='travel' />
      <EsimFormDialog />
    </div>
  );
}
