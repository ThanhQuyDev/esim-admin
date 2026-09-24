import PageContainer from '@/components/layout/page-container';
import { PortalPayoutsView } from '@/features/partner-portal/components/portal-payouts-view';

export const metadata = {
  title: 'Cổng đối tác: Rút tiền'
};

export default function PortalPayoutsPage() {
  return (
    <PageContainer
      pageTitle='Rút tiền'
      pageDescription='Tạo yêu cầu và theo dõi lịch sử rút hoa hồng.'
    >
      <PortalPayoutsView />
    </PageContainer>
  );
}
