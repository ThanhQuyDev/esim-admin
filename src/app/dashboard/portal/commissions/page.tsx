import PageContainer from '@/components/layout/page-container';
import { PortalCommissionsView } from '@/features/partner-portal/components/portal-commissions-view';
import { PortalFeatureGate } from '@/features/partner-portal/components/portal-feature-gate';

export const metadata = {
  title: 'Cổng đối tác: Hoa hồng'
};

export default function PortalCommissionsPage() {
  return (
    <PageContainer
      pageTitle='Hoa hồng'
      pageDescription='Khoản phát sinh, khoản chờ đối soát và khoản có thể rút.'
    >
      <PortalFeatureGate
        allow={['kol']}
        allowIfAffiliate
        title='Hoa hồng chưa được bật'
        description='Chương trình tiếp thị chưa được bật cho tài khoản của bạn. Đối tác phân phối cần được esim.vn cấp quyền affiliate mới dùng được link tiếp thị, mã giảm giá, hoa hồng và rút tiền. Liên hệ esim.vn nếu bạn muốn tham gia.'
      >
        <PortalCommissionsView />
      </PortalFeatureGate>
    </PageContainer>
  );
}
