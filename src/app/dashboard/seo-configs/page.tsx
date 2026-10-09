import PageContainer from '@/components/layout/page-container';
import SeoConfigListingPage from '@/features/seo-configs/components/seo-config-listing';
import { SeoConfigFormDialogTrigger } from '@/features/seo-configs/components/seo-config-form-dialog';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Cấu hình SEO'
};

type PageProps = { searchParams: Promise<SearchParams> };

export default async function SeoConfigsPage(props: PageProps) {
  // The listing reads its filters from this cache (#035), so it must be filled
  // first — without it nuqs throws "Empty search params cache" and the whole
  // page showed "Application error" (#035/#036, test round 4).
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      pageTitle='Cấu hình SEO'
      pageDescription='Quản lý cấu hình SEO cho các trang.'
      pageHeaderAction={<SeoConfigFormDialogTrigger />}
    >
      <SeoConfigListingPage />
    </PageContainer>
  );
}
