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
      pageDescription='Cấu hình % hoa hồng (KOL) và % giảm giá tối đa (đối tác phân phối) theo hạng.'
    >
      <PartnerTiersView />
    </PageContainer>
  );
}
