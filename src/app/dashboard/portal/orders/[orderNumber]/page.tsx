import PageContainer from '@/components/layout/page-container';
import { PortalFeatureGate } from '@/features/partner-portal/components/portal-feature-gate';
import { PortalPurchaseDetailView } from '@/features/partner-portal/components/portal-purchase-detail-view';

export const metadata = {
  title: 'Cổng đối tác: Chi tiết đơn hàng'
};

/** "Chi tiết đơn hàng" of a distribution partner's own order (doitac-1410 #042). */
export default async function PortalPurchaseDetailPage({
  params
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  return (
    <PageContainer
      scrollable
      pageTitle='Chi tiết đơn hàng'
      pageDescription='Thông tin đơn, sản phẩm và các eSIM trong đơn.'
    >
      <PortalFeatureGate
        allow={['distribution']}
        title='Trang này dành cho đối tác phân phối'
        description='Đối tác tiếp thị không tự đặt mua hàng.'
      >
        <PortalPurchaseDetailView orderNumber={decodeURIComponent(orderNumber)} />
      </PortalFeatureGate>
    </PageContainer>
  );
}
