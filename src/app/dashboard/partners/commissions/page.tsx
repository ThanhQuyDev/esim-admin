import PageContainer from '@/components/layout/page-container';
import { CommissionsView } from '@/features/partners/components/commissions-view';

export const metadata = {
  title: 'Dashboard: Hoa hồng đối tác'
};

export default function PartnerCommissionsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Hoa hồng đối tác'
      pageDescription='Hoa hồng KOL phát sinh từ các đơn hàng quy về qua link tiếp thị.'
    >
      <CommissionsView />
    </PageContainer>
  );
}
