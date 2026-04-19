import PageContainer from '@/components/layout/page-container';
import FaqListingPage from '@/features/faqs/components/faq-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { FaqFormDialogTrigger } from '@/features/faqs/components/faq-form-dialog';

export const metadata = { title: 'Dashboard: Câu hỏi thường gặp' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function FaqsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Câu hỏi thường gặp'
      pageDescription='Quản lý các câu hỏi thường gặp của bạn.'
      pageHeaderAction={<FaqFormDialogTrigger />}
    >
      <FaqListingPage />
    </PageContainer>
  );
}
