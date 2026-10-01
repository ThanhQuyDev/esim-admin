import PageContainer from '@/components/layout/page-container';
import MenuSlideListingPage from '@/features/menu-slides/components/menu-slide-listing';
import { MenuSlideFormDialogTrigger } from '@/features/menu-slides/components/menu-slide-form-dialog';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: 'Dashboard: Slide Main Menu' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function MenuSlidesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Slide Main Menu'
      pageDescription='Quản lý hình ảnh và nội dung phần chạy slide trong main menu của website.'
      pageHeaderAction={<MenuSlideFormDialogTrigger />}
    >
      <MenuSlideListingPage />
    </PageContainer>
  );
}
