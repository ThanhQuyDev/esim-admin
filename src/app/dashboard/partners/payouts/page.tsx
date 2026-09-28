import PageContainer from '@/components/layout/page-container';
import { PayoutSummaryTiles } from '@/features/partners/components/payout-summary-tiles';
import { PayoutsView } from '@/features/partners/components/payouts-view';

export const metadata = {
  title: 'Dashboard: Tài chính'
};

export default function PartnerPayoutsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Tài chính'
      pageDescription='Yêu cầu rút tiền của đối tác tiếp thị và tiền ký quỹ của đối tác phân phối.'
    >
      <div className='space-y-4'>
        <PayoutSummaryTiles />
        <PayoutsView />
      </div>
    </PageContainer>
  );
}
