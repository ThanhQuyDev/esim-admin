import PageContainer from '@/components/layout/page-container';
import PartnerListingPage from '@/features/partners/components/partner-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Đối tác & KOL'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function PartnersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Đối tác & KOL'
      pageDescription='Quản lý đối tác phân phối và KOL.'
    >
      <PartnerListingPage />
    </PageContainer>
  );
}
