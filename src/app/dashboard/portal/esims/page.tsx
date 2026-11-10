import PageContainer from '@/components/layout/page-container';
import { PortalHoldNotice } from '@/features/partner-portal/components/portal-hold-notice';
import { PortalEsimsView } from '@/features/partner-portal/components/portal-esims-view';
import { PortalFeatureGate } from '@/features/partner-portal/components/portal-feature-gate';

export const metadata = {
  title: 'Cổng đối tác: Quản lý eSIM'
};

export default function PortalEsimsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Quản lý eSIM'
      pageDescription='Theo dõi các eSIM đã lấy hàng, đã kích hoạt và còn hiệu lực.'
    >
      <PortalFeatureGate
        allow={['distribution']}
        title='Trang này dành cho đối tác phân phối'
        description='Đối tác tiếp thị không lấy hàng eSIM nên không có tồn kho để theo dõi. Hoa hồng của bạn được tính trên đơn hàng phát sinh qua link hoặc mã của bạn.'
      >
        {/* A held account says so on top (doitac-0911 #023). */}
        <div className='flex min-w-0 flex-1 flex-col gap-4'>
          <PortalHoldNotice />
          <PortalEsimsView />
        </div>
      </PortalFeatureGate>
    </PageContainer>
  );
}
