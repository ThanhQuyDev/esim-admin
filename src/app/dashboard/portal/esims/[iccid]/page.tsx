import PageContainer from '@/components/layout/page-container';
import { PortalEsimDetailView } from '@/features/partner-portal/components/portal-esim-detail-view';
import { PortalFeatureGate } from '@/features/partner-portal/components/portal-feature-gate';

export const metadata = {
  title: 'Cổng đối tác: Chi tiết eSIM'
};

/** "Chi tiết eSIM" of one eSIM the partner bought (doitac-1410 #039). */
export default async function PortalEsimDetailPage({
  params
}: {
  params: Promise<{ iccid: string }>;
}) {
  const { iccid } = await params;
  return (
    <PageContainer
      scrollable
      pageTitle='Chi tiết eSIM'
      pageDescription='Thông tin cài đặt, gói cước và các gói đã topup của eSIM này.'
    >
      <PortalFeatureGate
        allow={['distribution']}
        title='Trang này dành cho đối tác phân phối'
        description='Đối tác tiếp thị không lấy hàng eSIM nên không có tồn kho để theo dõi.'
      >
        <PortalEsimDetailView iccid={decodeURIComponent(iccid)} />
      </PortalFeatureGate>
    </PageContainer>
  );
}
