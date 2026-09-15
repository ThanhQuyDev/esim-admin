import PageContainer from '@/components/layout/page-container';
import { MembershipTiersView } from '@/features/membership-tiers/components/membership-tiers-view';

export const metadata = {
  title: 'Dashboard: Hạng khách hàng'
};

export default function MembershipTiersPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Hạng khách hàng'
      pageDescription='Cấu hình ngưỡng chi tiêu, % hoàn tiền và thưởng giới thiệu của 4 hạng thành viên.'
    >
      <MembershipTiersView />
    </PageContainer>
  );
}
