import PageContainer from '@/components/layout/page-container';
import { PortalNotificationsView } from '@/features/partner-portal/components/portal-notifications-view';

export const metadata = {
  title: 'Cổng đối tác: Thông báo'
};

/** Every announcement, read and unread apart (doitac-1410 #016). */
export default function PortalNotificationsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Thông báo'
      pageDescription='Tất cả thông báo esim.vn gửi tới bạn.'
    >
      <PortalNotificationsView />
    </PageContainer>
  );
}
