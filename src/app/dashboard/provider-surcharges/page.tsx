import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import ProviderSurchargesListingPage from '@/features/provider-surcharges/components/provider-surcharges-listing';
import { ProviderSurchargesTableSkeleton } from '@/features/provider-surcharges/components/provider-surcharges-table';

export const metadata = { title: 'Dashboard: Thuế phí nhà cung cấp' };

export default function ProviderSurchargesPage() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Thuế phí nhà cung cấp'
      pageDescription='Cộng thêm thuế/phí cho từng nhà cung cấp trước khi hệ thống so sánh giá để chọn gói rẻ nhất.'
    >
      <Suspense fallback={<ProviderSurchargesTableSkeleton />}>
        <ProviderSurchargesListingPage />
      </Suspense>
    </PageContainer>
  );
}
