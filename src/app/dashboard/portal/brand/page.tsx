import PageContainer from '@/components/layout/page-container';
import { PortalBrandView } from '@/features/partner-portal/components/portal-brand-view';

export const metadata = {
  title: 'Cổng đối tác: Cấu hình thương hiệu'
};

export default function PortalBrandPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Cấu hình thương hiệu'
      pageDescription='Tên hiển thị, logo và giới thiệu trên trang đối tác của bạn.'
    >
      <PortalBrandView />
    </PageContainer>
  );
}
