import PageContainer from '@/components/layout/page-container';
import FooterListingPage from '@/features/footers/components/footer-listing';
import { FooterFormDialogTrigger } from '@/features/footers/components/footer-form-dialog';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: 'Dashboard: Footers' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function FootersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Footers'
      pageDescription='Quản lý footer links trên landing page.'
      pageHeaderAction={<FooterFormDialogTrigger />}
    >
      <FooterListingPage />
    </PageContainer>
  );
}
