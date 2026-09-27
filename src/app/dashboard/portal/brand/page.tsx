import PageContainer from '@/components/layout/page-container';
import { PortalBrandView } from '@/features/partner-portal/components/portal-brand-view';
import { PortalFeatureGate } from '@/features/partner-portal/components/portal-feature-gate';

export const metadata = {
  title: 'Cổng đối tác: Cấu hình thương hiệu'
};

export default function PortalBrandPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Cấu hình thương hiệu'
      pageDescription='Tên hiển thị, logo và câu giới thiệu gửi tới khách hàng.'
    >
      <PortalFeatureGate
        allow={['distribution']}
        title='Cấu hình thương hiệu không áp dụng cho đối tác tiếp thị'
        description='Mục này dành cho đối tác phân phối bán eSIM dưới thương hiệu riêng. Khách của bạn mua ngay trên esim.vn qua link hoặc mã giới thiệu, nên không có trang mang thương hiệu riêng để cấu hình.'
      >
        <PortalBrandView />
      </PortalFeatureGate>
    </PageContainer>
  );
}
