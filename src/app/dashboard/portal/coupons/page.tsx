import PageContainer from '@/components/layout/page-container';
import { PortalCouponsView } from '@/features/partner-portal/components/portal-coupons-view';
import { PortalFeatureGate } from '@/features/partner-portal/components/portal-feature-gate';

export const metadata = {
  title: 'Cổng đối tác: Mã giảm giá'
};

export default function PortalCouponsPage() {
  return (
    <PageContainer
      pageTitle='Mã giảm giá'
      pageDescription='Theo dõi lượt sử dụng và doanh số từ từng mã được cấp.'
    >
      <PortalFeatureGate
        allow={['kol']}
        allowIfAffiliate
        title='Mã giảm giá chưa được bật'
        description='Chương trình tiếp thị chưa được bật cho tài khoản của bạn. Đối tác phân phối cần được esim.vn cấp quyền affiliate mới dùng được link tiếp thị, mã giảm giá, hoa hồng và rút tiền. Liên hệ esim.vn nếu bạn muốn tham gia.'
      >
        <PortalCouponsView />
      </PortalFeatureGate>
    </PageContainer>
  );
}
