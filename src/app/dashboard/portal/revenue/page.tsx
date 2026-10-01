import PageContainer from '@/components/layout/page-container';
import { PortalFeatureGate } from '@/features/partner-portal/components/portal-feature-gate';
import { PortalRevenueView } from '@/features/partner-portal/components/portal-revenue-view';

export const metadata = {
  title: 'Cổng đối tác: Doanh thu và đơn hàng'
};

export default function PortalRevenuePage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Doanh thu và đơn hàng'
      pageDescription='Đối chiếu doanh thu bán ra, giá vốn đã trừ ví và phần chênh lệch.'
    >
      <PortalFeatureGate
        allow={['distribution']}
        title='Trang này dành cho đối tác phân phối'
        description='Đối tác tiếp thị không mua hàng nên không có giá vốn để đối chiếu. Thu nhập của bạn nằm ở mục Hoa hồng.'
      >
        <PortalRevenueView />
      </PortalFeatureGate>
    </PageContainer>
  );
}
