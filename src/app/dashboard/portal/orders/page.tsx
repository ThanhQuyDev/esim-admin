import PageContainer from '@/components/layout/page-container';
import { PortalHoldNotice } from '@/features/partner-portal/components/portal-hold-notice';
import { PortalOrdersSwitch } from '@/features/partner-portal/components/portal-orders-switch';

export const metadata = {
  title: 'Cổng đối tác: Đơn hàng'
};

export default function PortalOrdersPage() {
  return (
    <PageContainer pageTitle='Đơn hàng'>
      {/* A held account says so on top (doitac-0911 #023). */}
      <div className='flex min-w-0 flex-1 flex-col gap-4'>
        <PortalHoldNotice />
        <PortalOrdersSwitch />
      </div>
    </PageContainer>
  );
}
