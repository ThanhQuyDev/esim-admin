import PageContainer from '@/components/layout/page-container';
import { PartnerSettingsView } from '@/features/partners/components/partner-settings-view';

export const metadata = {
  title: 'Cài đặt chương trình đối tác'
};

export default function PartnerSettingsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Cài đặt chương trình'
      pageDescription='Ngưỡng chương trình và chính sách theo từng loại đối tác.'
    >
      <PartnerSettingsView />
    </PageContainer>
  );
}
