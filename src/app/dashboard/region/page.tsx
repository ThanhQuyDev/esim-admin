import PageContainer from '@/components/layout/page-container';
import RegionListingPage from '@/features/regions/components/region-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { RegionFormDialogTrigger } from '@/features/regions/components/region-form-dialog';

export const metadata = {
  title: 'Dashboard: Khu vực'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function RegionsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Khu vực'
      pageDescription='Quản lý các khu vực của bạn.'
      pageHeaderAction={<RegionFormDialogTrigger />}
    >
      <RegionListingPage />
    </PageContainer>
  );
}
