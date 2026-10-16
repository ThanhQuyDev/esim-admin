import PageContainer from '@/components/layout/page-container';
import { PartnerTiersView } from '@/features/partners/components/partner-tiers-view';

export const metadata = {
  title: 'Dashboard: Hạng đối tác'
};

export default function PartnerTiersPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Hạng đối tác'
      pageDescription='Danh sách hạng của đối tác tiếp thị, phân phối và API: ngưỡng xét hạng, ưu đãi, hạng mặc định và số đối tác đang áp dụng.'
    >
      <PartnerTiersView />
    </PageContainer>
  );
}
