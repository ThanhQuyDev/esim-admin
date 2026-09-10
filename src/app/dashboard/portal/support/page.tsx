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
      pageDescription='Gửi yêu cầu và theo dõi phản hồi từ đội ngũ esim.vn.'
    >
      <PortalSupportView />
    </PageContainer>
  );
}
