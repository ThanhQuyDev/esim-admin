import PageContainer from '@/components/layout/page-container';
import TopBarListingPage from '@/features/top-bars/components/top-bar-listing';
import { TopBarFormDialogTrigger } from '@/features/top-bars/components/top-bar-form-dialog';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: 'Dashboard: Top Bars' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function TopBarsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Top Bars'
      pageDescription='Quản lý top bars trên landing page.'
      pageHeaderAction={<TopBarFormDialogTrigger />}
    >
      <TopBarListingPage />
    </PageContainer>
  );
}
