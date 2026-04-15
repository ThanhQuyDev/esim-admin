import PageContainer from '@/components/layout/page-container';
import BlogListingPage from '@/features/blogs/components/blog-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { BlogFormSheetTrigger } from '@/features/blogs/components/blog-form-sheet';

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
      pageHeaderAction={<BlogFormSheetTrigger />}
    >
      <BlogListingPage />
    </PageContainer>
  );
}
