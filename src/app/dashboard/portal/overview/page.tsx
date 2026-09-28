import PageContainer from '@/components/layout/page-container';
import { PortalOverviewSwitch } from '@/features/partner-portal/components/portal-overview-switch';

export const metadata = {
  title: 'Cổng đối tác: Tổng quan'
};

export default function PortalOverviewPage() {
  return (
    <PageContainer scrollable pageTitle='Tổng quan'>
      <PortalOverviewSwitch />
    </PageContainer>
  );
}
