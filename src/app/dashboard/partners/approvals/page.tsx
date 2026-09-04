import PageContainer from '@/components/layout/page-container';
import { PartnerApprovalsView } from '@/features/partners/components/partner-approvals-view';

export const metadata = {
  title: 'Dashboard: Duyệt đăng ký đối tác'
};

export default function PartnerApprovalsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Duyệt đăng ký đối tác'
      pageDescription='Danh sách đăng ký đối tác/KOL đang chờ duyệt.'
    >
      <PartnerApprovalsView />
    </PageContainer>
  );
}
