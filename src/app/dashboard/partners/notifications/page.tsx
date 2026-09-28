import PageContainer from '@/components/layout/page-container';
import { PartnerNotificationsView } from '@/features/partners/components/partner-notifications-view';

export const metadata = {
  title: 'Dashboard: Thông báo đối tác'
};

export default function PartnerNotificationsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Thông báo'
      pageDescription='Soạn và gửi thông báo tới từng nhóm hoặc toàn bộ đối tác.'
    >
      <PartnerNotificationsView />
    </PageContainer>
  );
}
