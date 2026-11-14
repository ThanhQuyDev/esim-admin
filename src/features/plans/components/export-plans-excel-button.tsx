'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { exportPlansExcel } from '../api/service';
import { usePlanListFilters } from './plans-table/use-plan-list-filters';

/**
 * "Export Excel" beside the import buttons in the page header (vande-1411
 * #044). It reads the same URL filters as the table, so it still exports what
 * the table shows.
 */
export function ExportPlansExcelButton() {
  const { filters } = usePlanListFilters();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportPlansExcel(filters);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant='outline'
      onClick={handleExport}
      disabled={exporting}
      data-testid='plans-export-excel'
    >
      {exporting ? <Icons.spinner className='animate-spin' /> : <Icons.download />}
      Export Excel
    </Button>
  );
}
