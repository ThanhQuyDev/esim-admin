import PageContainer from '@/components/layout/page-container';
import { PortalLinksView } from '@/features/partner-portal/components/portal-links-view';

export const metadata = {
  title: 'Cổng đối tác: Link tiếp thị'
};

export default function PortalLinksPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Link tiếp thị'
      pageDescription='Tạo và theo dõi hiệu quả các link tiếp thị của bạn.'
    >
      <PortalLinksView />
    </PageContainer>
  );
}
