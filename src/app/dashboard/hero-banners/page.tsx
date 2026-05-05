import PageContainer from '@/components/layout/page-container';
import HeroBannerListingPage from '@/features/hero-banners/components/hero-banner-listing';
import { HeroBannerFormDialogTrigger } from '@/features/hero-banners/components/hero-banner-form-dialog';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: 'Dashboard: Hero Banners' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function HeroBannersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Hero Banners'
      pageDescription='Quản lý hero banners trên landing page.'
      pageHeaderAction={<HeroBannerFormDialogTrigger />}
    >
      <HeroBannerListingPage />
    </PageContainer>
  );
}
