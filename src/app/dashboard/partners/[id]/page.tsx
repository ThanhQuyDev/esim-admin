import PageContainer from '@/components/layout/page-container';
import { PartnerDetailView } from '@/features/partners/components/partner-detail-view';

export const metadata = {
  title: 'Dashboard: Chi tiết đối tác'
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PartnerDetailPage(props: PageProps) {
  const { id } = await props.params;

  return (
    <PageContainer scrollable pageTitle='Chi tiết đối tác'>
      <PartnerDetailView partnerId={Number(id)} />
    </PageContainer>
  );
}
