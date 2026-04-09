import PageContainer from '@/components/layout/page-container';
import RegionListingPage from '@/features/regions/components/region-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { RegionFormSheetTrigger } from '@/features/regions/components/region-form-sheet';

export const metadata = {
  title: 'Dashboard: Regions'
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
      pageTitle='Regions'
      pageDescription='Manage your regions.'
      pageHeaderAction={<RegionFormSheetTrigger />}
    >
      <RegionListingPage />
    </PageContainer>
  );
}
