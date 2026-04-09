import PageContainer from '@/components/layout/page-container';
import WcuListingPage from '@/features/why-choose-us/components/wcu-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { WcuFormSheetTrigger } from '@/features/why-choose-us/components/wcu-form-sheet';

export const metadata = { title: 'Dashboard: Why Choose Us' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function WhyChooseUsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Why Choose Us'
      pageDescription='Manage your Why Choose Us items.'
      pageHeaderAction={<WcuFormSheetTrigger />}
    >
      <WcuListingPage />
    </PageContainer>
  );
}
