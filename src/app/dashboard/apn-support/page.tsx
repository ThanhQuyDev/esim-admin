import PageContainer from '@/components/layout/page-container';
import ApnSupportListingPage from '@/features/apn-support/components/apn-support-listing';
import { ImportApnDialogTrigger } from '@/features/apn-support/components/import-apn-dialog';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: 'Dashboard: APN TikTok & ChatGPT' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function ApnSupportPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='APN TikTok & ChatGPT'
      pageDescription='Bảng tra APN quyết định gói eSIM nào dùng được TikTok, ChatGPT, Gemini, Claude. Sửa từng dòng, lấy APN mới từ gói cước, hoặc xuất Excel → điền → nạp lại (nạp file thay toàn bộ bảng).'
      pageHeaderAction={<ImportApnDialogTrigger />}
    >
      <ApnSupportListingPage />
    </PageContainer>
  );
}
