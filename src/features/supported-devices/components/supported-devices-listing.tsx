'use client';

import { Suspense } from 'react';
import { SupportedDevicesTable, SupportedDevicesTableSkeleton } from './supported-devices-table';

export default function SupportedDevicesListingPage() {
  return (
    <Suspense fallback={<SupportedDevicesTableSkeleton />}>
      <SupportedDevicesTable />
    </Suspense>
  );
}
