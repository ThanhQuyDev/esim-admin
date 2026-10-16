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
      pageDescription='Xác nhận hoặc từ chối các yêu cầu nạp ký quỹ của đối tác. Đã xác nhận hoặc từ chối thì không thể hoàn tác.'
    >
      <DepositRequestsView />
    </PageContainer>
  );
}
