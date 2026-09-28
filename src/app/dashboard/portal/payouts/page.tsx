import PageContainer from '@/components/layout/page-container';
import { PortalPayoutsView } from '@/features/partner-portal/components/portal-payouts-view';
import { PortalFeatureGate } from '@/features/partner-portal/components/portal-feature-gate';

export const metadata = {
  title: 'Cổng đối tác: Rút tiền'
};

export default function PortalPayoutsPage() {
  return (
    <PageContainer
      pageTitle='Rút tiền'
      pageDescription='Tạo yêu cầu và theo dõi lịch sử rút hoa hồng.'
    >
      <PortalFeatureGate
        allow={['kol']}
        allowIfAffiliate
        title='Rút tiền chưa được bật'
        description='Chương trình tiếp thị chưa được bật cho tài khoản của bạn. Đối tác phân phối cần được esim.vn cấp quyền affiliate mới dùng được link tiếp thị, mã giảm giá, hoa hồng và rút tiền. Liên hệ esim.vn nếu bạn muốn tham gia.'
      >
        <PortalPayoutsView />
      </PortalFeatureGate>
    </PageContainer>
  );
}
