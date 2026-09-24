import PageContainer from '@/components/layout/page-container';
import { PortalLinksView } from '@/features/partner-portal/components/portal-links-view';

export const metadata = {
  title: 'Cổng đối tác: Link tiếp thị'
};

export default function PortalLinksPage() {
  return (
    <PageContainer
      pageTitle='Link tiếp thị'
      pageDescription='Tạo liên kết giới thiệu, mã QR và theo dõi hiệu suất từng kênh.'
    >
      <PortalLinksView />
    </PageContainer>
  );
}
