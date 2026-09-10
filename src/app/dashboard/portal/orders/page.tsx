import PageContainer from '@/components/layout/page-container';
import { PortalOrdersView } from '@/features/partner-portal/components/portal-orders-view';

export const metadata = {
  title: 'Cổng đối tác: Đơn hàng'
};

export default function PortalOrdersPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Đơn hàng'
      pageDescription='Các đơn hàng được ghi nhận qua link tiếp thị của bạn.'
    >
      <PortalOrdersView />
    </PageContainer>
  );
}
