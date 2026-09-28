import PageContainer from '@/components/layout/page-container';
import { PartnerOrdersView } from '@/features/partners/components/partner-orders-view';

export const metadata = {
  title: 'Dashboard: Đơn hàng đối tác'
};

export default function PartnerOrdersPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Đơn hàng đối tác'
      pageDescription='Đơn ghi nhận cho đối tác tiếp thị và đơn do đối tác phân phối tự đặt.'
    >
      <PartnerOrdersView />
    </PageContainer>
  );
}
