import PageContainer from '@/components/layout/page-container';
import { CustomerAnnouncementComposer } from '@/features/announcements/components/customer-announcement-composer';

export const metadata = {
  title: 'Dashboard: Soạn thông báo gửi khách hàng'
};

export default function NewCustomerAnnouncementPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Soạn thông báo gửi khách hàng'
      pageDescription='Email gửi từ service@esim.com.vn tới nhóm khách hàng bạn chọn. Bên phải là email khách hàng sẽ nhận.'
    >
      <CustomerAnnouncementComposer />
    </PageContainer>
  );
}
