import PageContainer from '@/components/layout/page-container';
import { PortalCommissionsView } from '@/features/partner-portal/components/portal-commissions-view';

export const metadata = {
  title: 'Cổng đối tác: Hoa hồng'
};

export default function PortalCommissionsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Hoa hồng'
      pageDescription='Danh sách hoa hồng theo đơn hàng từ link tiếp thị.'
    >
      <PortalCommissionsView />
    </PageContainer>
  );
}
