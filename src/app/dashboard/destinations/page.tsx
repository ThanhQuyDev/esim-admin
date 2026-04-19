import PageContainer from '@/components/layout/page-container';
import DestinationListingPage from '@/features/destinations/components/destination-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { DestinationFormDialogTrigger } from '@/features/destinations/components/destination-form-dialog';

export const metadata = {
  title: 'Dashboard: Điểm đến'
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
      pageTitle='Điểm đến'
      pageDescription='Quản lý các điểm đến của bạn.'
      pageHeaderAction={<DestinationFormDialogTrigger />}
    >
      <DestinationListingPage />
    </PageContainer>
  );
}
