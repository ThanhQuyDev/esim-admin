import PageContainer from '@/components/layout/page-container';
import { DepositRequestsView } from '@/features/partners/components/deposit-requests-view';

export const metadata = {
  title: 'Dashboard: Yêu cầu nạp ký quỹ'
};

export default function DepositRequestsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Yêu cầu nạp ký quỹ'
      pageDescription='Xác nhận các yêu cầu nạp ký quỹ qua chuyển khoản của đối tác phân phối.'
    >
      <DepositRequestsView />
    </PageContainer>
  );
}
