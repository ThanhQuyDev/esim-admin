import PageContainer from '@/components/layout/page-container';
import FaqListingPage from '@/features/faqs/components/faq-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { FaqFormSheetTrigger } from '@/features/faqs/components/faq-form-sheet';

export const metadata = { title: 'Dashboard: FAQs' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function FaqsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='FAQs'
      pageDescription='Manage your frequently asked questions.'
      pageHeaderAction={<FaqFormSheetTrigger />}
    >
      <FaqListingPage />
    </PageContainer>
  );
}
