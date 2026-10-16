import PageContainer from '@/components/layout/page-container';
import { PortalPurchaseDetailView } from '@/features/partner-portal/components/portal-purchase-detail-view';
import { PartnerOrderAdminDetail } from '@/features/partners/components/partner-order-admin-detail';

export const metadata = {
  title: 'Dashboard: Chi tiết đơn hàng đối tác'
};

/**
 * "Xem chi tiết" from "Đơn hàng đối tác" (doitac-1410 #058): the page each
 * kind of partner reads for the same order.
 */
export default async function PartnerOrderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { orderNumber } = await params;
  const { type } = await searchParams;
  const code = decodeURIComponent(orderNumber);
  const distribution = type === 'distribution';
  return (
    <PageContainer
      scrollable
      pageTitle='Chi tiết đơn hàng đối tác'
      pageDescription={
        distribution
          ? 'Đơn đối tác phân phối tự đặt: sản phẩm, eSIM và tiền hoàn về ví ký quỹ.'
          : 'Đơn ghi nhận cho đối tác tiếp thị: sản phẩm, hoa hồng và nguồn giới thiệu.'
      }
    >
      {distribution ? (
        <PortalPurchaseDetailView orderNumber={code} admin />
      ) : (
        <PartnerOrderAdminDetail orderNumber={code} />
      )}
    </PageContainer>
  );
}
