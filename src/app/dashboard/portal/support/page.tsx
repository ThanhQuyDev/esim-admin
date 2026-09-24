import PageContainer from '@/components/layout/page-container';
import { PortalSupportView } from '@/features/partner-portal/components/portal-support-view';

export const metadata = {
  title: 'Cổng đối tác: Hỗ trợ'
};

export default function PortalSupportPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Hỗ trợ'
      pageDescription='Tạo, theo dõi và phản hồi các yêu cầu hỗ trợ.'
    >
      <PortalSupportView />
    </PageContainer>
  );
}
