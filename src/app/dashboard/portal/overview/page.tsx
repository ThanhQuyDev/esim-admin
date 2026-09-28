import PageContainer from '@/components/layout/page-container';
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
        <PortalOverviewSwitch />
      </div>
    </PageContainer>
  );
}
