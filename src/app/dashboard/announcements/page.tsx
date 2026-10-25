import PageContainer from '@/components/layout/page-container';
import {
  AnnouncementsView,
  type AnnouncementTab
} from '@/features/announcements/components/announcements-view';

export const metadata = {
  title: 'Dashboard: Thông báo'
};

export default async function AnnouncementsPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab: AnnouncementTab = tab === 'partner' ? 'partner' : 'customer';
  return (
    <PageContainer
      scrollable
      pageTitle='Thông báo'
      pageDescription='Thông báo qua email gửi khách hàng, và thông báo gửi đối tác.'
    >
      <AnnouncementsView initialTab={initialTab} />
    </PageContainer>
  );
}
