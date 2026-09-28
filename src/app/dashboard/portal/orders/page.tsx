import PageContainer from '@/components/layout/page-container';
import { PortalOrdersSwitch } from '@/features/partner-portal/components/portal-orders-switch';

export const metadata = {
  title: 'Cổng đối tác: Đơn hàng'
};

export default function PortalOrdersPage() {
  return (
    <PageContainer pageTitle='Đơn hàng'>
      <PortalOrdersSwitch />
    </PageContainer>
  );
}
