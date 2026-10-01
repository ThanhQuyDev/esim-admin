import PageContainer from '@/components/layout/page-container';
import { PortalCatalogueView } from '@/features/partner-portal/components/portal-catalogue-view';
import { PortalFeatureGate } from '@/features/partner-portal/components/portal-feature-gate';

export const metadata = {
  title: 'Cổng đối tác: Sản phẩm & bảng giá'
};

export default function PortalCataloguePage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Sản phẩm & bảng giá'
      pageDescription='Tra cứu giá vốn và đặt mua bằng số dư ví ký quỹ.'
    >
      <PortalFeatureGate
        allow={['distribution']}
        title='Trang này dành cho đối tác phân phối'
        description='Đối tác tiếp thị không lấy hàng eSIM nên không có bảng giá vốn. Thu nhập của bạn là hoa hồng trên đơn phát sinh qua link hoặc mã của bạn.'
      >
        <PortalCatalogueView />
      </PortalFeatureGate>
    </PageContainer>
  );
}
