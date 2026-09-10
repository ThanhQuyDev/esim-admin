import PageContainer from '@/components/layout/page-container';
import { PortalTierView } from '@/features/partner-portal/components/portal-tier-view';

export const metadata = {
  title: 'Cổng đối tác: Hạng đối tác'
};

export default function PortalTierPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Hạng đối tác'
      pageDescription='Quyền lợi theo hạng và tiến độ lên hạng.'
    >
      <PortalTierView />
    </PageContainer>
  );
}
