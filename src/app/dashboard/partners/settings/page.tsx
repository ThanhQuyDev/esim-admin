import PageContainer from '@/components/layout/page-container';
import { PartnerSettingsView } from '@/features/partners/components/partner-settings-view';

export const metadata = {
  title: 'Cấu hình chung đối tác'
};

export default function PartnerSettingsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Cấu hình chung'
      pageDescription='Ngưỡng chương trình và chính sách theo từng loại đối tác.'
    >
      <PartnerSettingsView />
    </PageContainer>
  );
}
