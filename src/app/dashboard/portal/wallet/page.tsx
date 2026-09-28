import PageContainer from '@/components/layout/page-container';
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
        description='Bạn không mua eSIM để bán lại nên không cần ký quỹ. Thu nhập của bạn là hoa hồng từ đơn hàng trên esim.vn, xem ở mục Hoa hồng và rút về tài khoản ngân hàng ở mục Rút tiền.'
      >
        <PortalWalletView />
      </PortalFeatureGate>
    </PageContainer>
  );
}
