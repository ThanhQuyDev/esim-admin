import PageContainer from '@/components/layout/page-container';
import { PartnerComposerPage } from '@/features/announcements/components/partner-composer-page';

export const metadata = {
  title: 'Dashboard: Soạn thông báo gửi đối tác'
};

export default function NewPartnerAnnouncementPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Soạn thông báo gửi đối tác'
      pageDescription='Gửi tới từng nhóm hoặc toàn bộ đối tác. Thông báo đã gửi xem ở tab "Thông báo Đối tác".'
    >
      <PartnerComposerPage />
    </PageContainer>
  );
}
