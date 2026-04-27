import PageContainer from '@/components/layout/page-container';
import EsimListingPage from '@/features/esims/components/esim-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Quản lý eSIM'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function EsimsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Quản lý eSIM'
      pageDescription='Danh sách các eSIM trong hệ thống.'
    >
      <EsimListingPage />
    </PageContainer>
  );
}
