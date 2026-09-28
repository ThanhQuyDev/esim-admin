import PageContainer from '@/components/layout/page-container';
import { CommissionSummaryTiles } from '@/features/partners/components/commission-summary-tiles';
import { CommissionsSwitch } from '@/features/partners/components/commissions-switch';

export const metadata = {
  title: 'Dashboard: Hoa hồng & Đối soát'
};

export default function PartnerCommissionsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Hoa hồng & Đối soát'
      pageDescription='Đối soát hoa hồng theo kỳ và toàn bộ hoa hồng phát sinh theo từng đơn.'
    >
      <div className='space-y-4'>
        <CommissionSummaryTiles />
        <CommissionsSwitch />
      </div>
    </PageContainer>
  );
}
