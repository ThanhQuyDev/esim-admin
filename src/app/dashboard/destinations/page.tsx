import PageContainer from '@/components/layout/page-container';
import DestinationListingPage from '@/features/destinations/components/destination-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { DestinationFormSheetTrigger } from '@/features/destinations/components/destination-form-sheet';

export const metadata = {
  title: 'Dashboard: Destinations'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function DestinationsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Destinations'
      pageDescription='Manage your destinations.'
      pageHeaderAction={<DestinationFormSheetTrigger />}
    >
      <DestinationListingPage />
    </PageContainer>
  );
}
