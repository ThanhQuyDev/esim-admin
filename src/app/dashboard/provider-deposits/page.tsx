import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import ProviderDepositsListingPage from '@/features/provider-deposits/components/provider-deposits-listing';
import { ProviderDepositFormDialogTrigger } from '@/features/provider-deposits/components/provider-deposit-form-dialog';
import { ProviderDepositsTableSkeleton } from '@/features/provider-deposits/components/provider-deposits-table';

export const metadata = { title: 'Dashboard: Ký quỹ nhà cung cấp' };

export default function ProviderDepositsPage() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Ký quỹ nhà cung cấp'
      pageDescription='Nhập số tiền đã ký quỹ với từng nhà cung cấp và theo dõi số dư còn lại xem có lệch so với số nhà cung cấp báo không.'
      pageHeaderAction={<ProviderDepositFormDialogTrigger />}
    >
      <Suspense fallback={<ProviderDepositsTableSkeleton />}>
        <ProviderDepositsListingPage />
      </Suspense>
    </PageContainer>
  );
}
