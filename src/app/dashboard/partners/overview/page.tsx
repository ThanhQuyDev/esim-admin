import PageContainer from '@/components/layout/page-container';
import { PartnerOverviewView } from '@/features/partners/components/partner-overview-view';

export const metadata = {
  title: 'Tổng quan đối tác'
};

export default function PartnerOverviewPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Tổng quan đối tác'
      pageDescription='Việc cần xử lý, quy mô chương trình và hiệu quả 30 ngày.'
    >
      <PartnerOverviewView />
    </PageContainer>
  );
}
