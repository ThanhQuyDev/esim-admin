import PageContainer from '@/components/layout/page-container';
import HelpCenterListingPage from '@/features/help-center/components/help-center-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Dashboard: Trung tâm hỗ trợ' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function HelpCenterPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Trung tâm hỗ trợ'
      pageDescription='Quản lý các bài viết trung tâm hỗ trợ.'
      pageHeaderAction={
        <Button asChild>
          <Link href='/dashboard/help-center/new'>
            <Icons.add className='mr-2 h-4 w-4' /> Tạo bài viết
          </Link>
        </Button>
      }
    >
      <HelpCenterListingPage />
    </PageContainer>
  );
}
