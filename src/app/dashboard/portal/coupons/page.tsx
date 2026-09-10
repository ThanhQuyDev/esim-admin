import PageContainer from '@/components/layout/page-container';
import { PortalCouponsView } from '@/features/partner-portal/components/portal-coupons-view';

export const metadata = {
  title: 'Cổng đối tác: Mã giảm giá'
};

export default function PortalCouponsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Mã giảm giá'
      pageDescription='Mã giảm giá esim.vn cấp cho bạn và hiệu quả sử dụng.'
    >
      <PortalCouponsView />
    </PageContainer>
  );
}
