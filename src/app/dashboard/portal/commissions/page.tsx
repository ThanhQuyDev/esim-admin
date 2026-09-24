import PageContainer from '@/components/layout/page-container';
import { PortalCommissionsView } from '@/features/partner-portal/components/portal-commissions-view';

export const metadata = {
  title: 'Cổng đối tác: Hoa hồng'
};

export default function PortalCommissionsPage() {
  return (
    <PageContainer
      pageTitle='Hoa hồng'
      pageDescription='Khoản phát sinh, khoản chờ đối soát và khoản có thể rút.'
    >
      <PortalCommissionsView />
    </PageContainer>
  );
}
