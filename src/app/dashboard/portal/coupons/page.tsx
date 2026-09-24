import PageContainer from '@/components/layout/page-container';
import { PortalCouponsView } from '@/features/partner-portal/components/portal-coupons-view';

export const metadata = {
  title: 'Cổng đối tác: Mã giảm giá'
};

export default function PortalCouponsPage() {
  return (
    <PageContainer
      pageTitle='Mã giảm giá'
      pageDescription='Theo dõi lượt sử dụng và doanh số từ từng mã được cấp.'
    >
      <PortalCouponsView />
    </PageContainer>
  );
}
