import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import ProviderSurchargesListingPage from '@/features/provider-surcharges/components/provider-surcharges-listing';
import { ProviderSurchargesTableSkeleton } from '@/features/provider-surcharges/components/provider-surcharges-table';
import ProviderDepositsListingPage from '@/features/provider-deposits/components/provider-deposits-listing';
import { ProviderDepositFormDialogTrigger } from '@/features/provider-deposits/components/provider-deposit-form-dialog';
import { ProviderDepositsTableSkeleton } from '@/features/provider-deposits/components/provider-deposits-table';
import ProviderSalesStatusListingPage from '@/features/providers/components/provider-sales-status-listing';
import { ProviderSalesStatusTableSkeleton } from '@/features/providers/components/provider-sales-status-table';
import {
  ProvidersHeaderAction,
  ProvidersTabs
} from '@/features/providers/components/providers-tabs';

export const metadata = { title: 'Dashboard: Nhà cung cấp' };

/**
 * Everything about suppliers behind one menu entry (#005): tax/fee, deposits and
 * the on/off switch used to pull a supplier off sale, split into tabs.
 */
export default function ProvidersPage() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Nhà cung cấp'
      pageDescription='Thuế phí, ký quỹ và bật/tắt bán của từng nhà cung cấp.'
      pageHeaderAction={<ProvidersHeaderAction deposits={<ProviderDepositFormDialogTrigger />} />}
    >
      <ProvidersTabs
        surcharges={
          <Suspense fallback={<ProviderSurchargesTableSkeleton />}>
            <ProviderSurchargesListingPage />
          </Suspense>
        }
        deposits={
          <Suspense fallback={<ProviderDepositsTableSkeleton />}>
            <ProviderDepositsListingPage />
          </Suspense>
        }
        salesStatus={
          <Suspense fallback={<ProviderSalesStatusTableSkeleton />}>
            <ProviderSalesStatusListingPage />
          </Suspense>
        }
      />
    </PageContainer>
  );
}
