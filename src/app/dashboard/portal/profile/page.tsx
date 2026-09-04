import PageContainer from '@/components/layout/page-container';
import { PortalProfileView } from '@/features/partner-portal/components/portal-profile-view';

export const metadata = {
  title: 'Cổng đối tác: Hồ sơ'
};

export default function PortalProfilePage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Hồ sơ đối tác'
      pageDescription='Thông tin liên hệ và kênh bán hàng.'
    >
      <PortalProfileView />
    </PageContainer>
  );
}
