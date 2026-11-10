import PageContainer from '@/components/layout/page-container';
import { PortalHoldNotice } from '@/features/partner-portal/components/portal-hold-notice';
import { PortalNotificationBanner } from '@/features/partner-portal/components/portal-notification-bell';
import { PortalOverviewSwitch } from '@/features/partner-portal/components/portal-overview-switch';

export const metadata = {
  title: 'Cổng đối tác: Tổng quan'
};

export default function PortalOverviewPage() {
  return (
    <PageContainer scrollable pageTitle='Tổng quan'>
      <div className='flex flex-1 flex-col space-y-4'>
        {/* The newest unread announcement, where a partner lands (#079). */}
        <PortalNotificationBanner />
        {/* A held account says so where the partner lands (doitac-0911 #023). */}
        <PortalHoldNotice />
        <PortalOverviewSwitch />
      </div>
    </PageContainer>
  );
}
