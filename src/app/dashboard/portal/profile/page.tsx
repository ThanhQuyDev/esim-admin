import PageContainer from '@/components/layout/page-container';
import { MustChangePasswordGate } from '@/features/partner-portal/components/must-change-password-gate';
import { PortalProfileView } from '@/features/partner-portal/components/portal-profile-view';

export const metadata = {
  title: 'Cổng đối tác: Hồ sơ'
};

export default function PortalProfilePage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Hồ sơ'
      pageDescription='Thông tin pháp lý, kênh tiếp thị, thanh toán và bảo mật.'
    >
      <MustChangePasswordGate />
      <PortalProfileView />
    </PageContainer>
  );
}
