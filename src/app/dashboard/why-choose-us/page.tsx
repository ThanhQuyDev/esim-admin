import PageContainer from '@/components/layout/page-container';
import WcuListingPage from '@/features/why-choose-us/components/wcu-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { WcuFormDialogTrigger } from '@/features/why-choose-us/components/wcu-form-dialog';

export const metadata = { title: 'Dashboard: Tại sao chọn chúng tôi' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function WhyChooseUsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Tại sao chọn chúng tôi'
      pageDescription='Quản lý các mục "Tại sao chọn chúng tôi".'
      pageHeaderAction={<WcuFormDialogTrigger />}
    >
      <WcuListingPage />
    </PageContainer>
  );
}
