import PageContainer from '@/components/layout/page-container';
import BlogListingPage from '@/features/blogs/components/blog-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Dashboard: Bài viết' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function BlogsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Bài viết'
      pageDescription='Quản lý các bài viết của bạn.'
      pageHeaderAction={
        <Button asChild>
          <Link href='/dashboard/blogs/new'>
            <Icons.add className='mr-2 h-4 w-4' /> Tạo bài viết
          </Link>
        </Button>
      }
    >
      <BlogListingPage />
    </PageContainer>
  );
}
