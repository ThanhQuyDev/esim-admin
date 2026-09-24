import PageContainer from '@/components/layout/page-container';
import { PortalWalletView } from '@/features/partner-portal/components/portal-wallet-view';

export const metadata = {
  title: 'Cổng đối tác: Ví ký quỹ'
};

export default function PortalWalletPage() {
  return (
    <PageContainer pageTitle='Ví ký quỹ' pageDescription='Số dư, yêu cầu nạp và lịch sử giao dịch.'>
      <PortalWalletView />
    </PageContainer>
  );
}
