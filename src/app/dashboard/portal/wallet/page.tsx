import PageContainer from '@/components/layout/page-container';
import { PortalHoldNotice } from '@/features/partner-portal/components/portal-hold-notice';
import { PortalWalletView } from '@/features/partner-portal/components/portal-wallet-view';
import { PortalFeatureGate } from '@/features/partner-portal/components/portal-feature-gate';

export const metadata = {
  title: 'Cổng đối tác: Thanh toán'
};

export default function PortalWalletPage() {
  return (
    <PageContainer
      pageTitle='Thanh toán'
      pageDescription='Quản lý số dư, nạp tiền và lịch sử giao dịch.'
    >
      <PortalFeatureGate
        allow={['distribution']}
        title='Trang này dành cho đối tác phân phối'
        description='Bạn không mua eSIM để bán lại nên không cần ký quỹ. Thu nhập của bạn là hoa hồng từ đơn hàng trên esim.vn, xem ở mục Hoa hồng và rút về tài khoản ngân hàng ở mục Thanh toán.'
      >
        {/* A held account says so on top (doitac-0911 #023). */}
        <div className='flex min-w-0 flex-1 flex-col gap-4'>
          <PortalHoldNotice />
          <PortalWalletView />
        </div>
      </PortalFeatureGate>
    </PageContainer>
  );
}
