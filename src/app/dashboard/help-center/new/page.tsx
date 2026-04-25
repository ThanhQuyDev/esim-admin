import PageContainer from '@/components/layout/page-container';
import { HelpCenterFormPage } from '@/features/help-center/components/help-center-form-page';

export const metadata = { title: 'Dashboard: Tạo bài viết hỗ trợ mới' };

export default function NewHelpCenterPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Tạo bài viết mới'
      pageDescription='Viết bài viết cho trung tâm hỗ trợ.'
    >
      <HelpCenterFormPage />
    </PageContainer>
  );
}
