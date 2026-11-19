import PageContainer from '@/components/layout/page-container';
import { PortalHoldNotice } from '@/features/partner-portal/components/portal-hold-notice';
import { PortalPayoutsView } from '@/features/partner-portal/components/portal-payouts-view';
import { PortalFeatureGate } from '@/features/partner-portal/components/portal-feature-gate';

export const metadata = {
  title: 'Cổng đối tác: Thanh toán'
};

export default function PortalPayoutsPage() {
  return (
    <PageContainer
      pageTitle='Thanh toán'
      pageDescription='Rút hoa hồng về tài khoản ngân hàng, theo dõi lịch sử thanh toán và mọi giao dịch cộng/trừ hoa hồng.'
    >
      <PortalFeatureGate
        allow={['kol']}
        allowIfAffiliate
        title='Thanh toán chưa được bật'
        description='Chương trình tiếp thị chưa được bật cho tài khoản của bạn. Đối tác phân phối cần được esim.vn cấp quyền affiliate mới dùng được link tiếp thị, mã giảm giá, hoa hồng và rút tiền. Liên hệ esim.vn nếu bạn muốn tham gia.'
      >
        {/* A held account says so here too (vande-2011 #024). */}
        <div className='space-y-4'>
          <PortalHoldNotice />
          <PortalPayoutsView />
        </div>
      </PortalFeatureGate>
    </PageContainer>
  );
}
