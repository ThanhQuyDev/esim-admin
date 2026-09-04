import PageContainer from '@/components/layout/page-container';
import { PortalPayoutsView } from '@/features/partner-portal/components/portal-payouts-view';

export const metadata = {
  title: 'Cổng đối tác: Yêu cầu rút tiền'
};

export default function PortalPayoutsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Yêu cầu rút tiền'
      pageDescription='Tạo và theo dõi các yêu cầu rút hoa hồng / ký quỹ.'
    >
      <PortalPayoutsView />
    </PageContainer>
  );
}
