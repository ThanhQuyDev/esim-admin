import PageContainer from '@/components/layout/page-container';
import { PortalOverviewView } from '@/features/partner-portal/components/portal-overview-view';

export const metadata = {
  title: 'Cổng đối tác: Tổng quan'
};

export default function PortalOverviewPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Tổng quan'
      pageDescription='Hiệu suất tiếp thị, hoa hồng và tiến độ hạng của bạn.'
    >
      <PortalOverviewView />
    </PageContainer>
  );
}
