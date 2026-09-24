import PageContainer from '@/components/layout/page-container';
import { PortalTierRulesView } from '@/features/partner-portal/components/portal-tier-rules-view';

export const metadata = {
  title: 'Cổng đối tác: Quy định xét hạng'
};

export default function PortalTierRulesPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Quy định xét hạng'
      pageDescription='Điều kiện, kỳ đánh giá và nguyên tắc cập nhật hạng.'
    >
      <PortalTierRulesView />
    </PageContainer>
  );
}
