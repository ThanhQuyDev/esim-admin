import PageContainer from '@/components/layout/page-container';
import { PartnerOrdersView } from '@/features/partners/components/partner-orders-view';

export const metadata = {
  title: 'Dashboard: Đơn hàng đối tác'
};

export default async function PartnerOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // "Danh sách đơn hàng" from a distribution order comes back to its tab (#058).
  const { tab } = await searchParams;
  return (
    <PageContainer
      scrollable
      pageTitle='Đơn hàng đối tác'
      pageDescription='Đơn ghi nhận cho đối tác tiếp thị và đơn do đối tác phân phối tự đặt.'
    >
      <PartnerOrdersView initialTab={tab === 'distribution' ? 'distribution' : 'kol'} />
    </PageContainer>
  );
}
