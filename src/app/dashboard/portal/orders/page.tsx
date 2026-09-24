import PageContainer from '@/components/layout/page-container';
import { PortalOrdersView } from '@/features/partner-portal/components/portal-orders-view';

export const metadata = {
  title: 'Cổng đối tác: Đơn hàng'
};

export default function PortalOrdersPage() {
  return (
    <PageContainer
      pageTitle='Đơn hàng'
      pageDescription='Theo dõi nguồn ghi nhận, trạng thái eSIM và vòng đời hoa hồng.'
    >
      <PortalOrdersView />
    </PageContainer>
  );
}
