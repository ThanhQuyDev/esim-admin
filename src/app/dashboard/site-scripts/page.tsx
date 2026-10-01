import PageContainer from '@/components/layout/page-container';
import SiteScriptListingPage from '@/features/site-scripts/components/site-script-listing';
import { SiteScriptFormDialogTrigger } from '@/features/site-scripts/components/site-script-form-dialog';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: 'Dashboard: Script toàn site' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function SiteScriptsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Script toàn site'
      pageDescription='Mã Google Analytics, Tag Manager, Ads… dán một lần và tự chèn vào mọi trang.'
      pageHeaderAction={<SiteScriptFormDialogTrigger />}
    >
      <SiteScriptListingPage />
    </PageContainer>
  );
}
