import PageContainer from '@/components/layout/page-container';
import { CommissionsView } from '@/features/partners/components/commissions-view';

export const metadata = {
  title: 'Dashboard: Hoa hồng & Đối soát'
};

export default function PartnerCommissionsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Hoa hồng & Đối soát'
      pageDescription='Hoa hồng phát sinh, đã duyệt, đang chờ chi và các khoản đã điều chỉnh.'
    >
      <CommissionsView />
    </PageContainer>
  );
}
