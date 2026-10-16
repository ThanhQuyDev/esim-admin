import PageContainer from '@/components/layout/page-container';
import { PartnerLinksAdminView } from '@/features/partners/components/partner-links-admin-view';

export const metadata = {
  title: 'Tiếp thị liên kết'
};

/** Every partner's marketing links (doitac-1410 #051–#055). */
export default function PartnerLinksAdminPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Tiếp thị liên kết'
      pageDescription='Liên kết tiếp thị của mọi đối tác: trạng thái, hiệu quả và các thao tác quản trị.'
    >
      <PartnerLinksAdminView />
    </PageContainer>
  );
}
