import PageContainer from '@/components/layout/page-container';
import { PayoutsView } from '@/features/partners/components/payouts-view';

export const metadata = {
  title: 'Dashboard: Yêu cầu rút tiền'
};

export default function PartnerPayoutsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Yêu cầu rút tiền'
      pageDescription='Duyệt và thanh toán các yêu cầu rút tiền của đối tác/KOL.'
    >
      <PayoutsView />
    </PageContainer>
  );
}
