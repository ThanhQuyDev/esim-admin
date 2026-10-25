import PageContainer from '@/components/layout/page-container';
import { PayoutSummaryTiles } from '@/features/partners/components/payout-summary-tiles';
import { PayoutsView } from '@/features/partners/components/payouts-view';

export const metadata = {
  title: 'Dashboard: Tài chính'
};

export default async function PartnerPayoutsPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  return (
    <PageContainer
      scrollable
      pageTitle='Tài chính'
      pageDescription='Yêu cầu rút tiền của đối tác tiếp thị và yêu cầu nạp ký quỹ của đối tác phân phối / API — duyệt, từ chối và theo dõi trong một danh sách.'
    >
      <div className='grid min-w-0 grid-cols-1 gap-4'>
        <PayoutSummaryTiles />
        <PayoutsView initialKind={type} />
      </div>
    </PageContainer>
  );
}
