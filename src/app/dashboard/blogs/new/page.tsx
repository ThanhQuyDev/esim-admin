import PageContainer from '@/components/layout/page-container';
import { BlogFormPage } from '@/features/blogs/components/blog-form-page';

export const metadata = { title: 'Dashboard: Tạo bài viết mới' };

export default function NewBlogPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Tạo bài viết mới'
      pageDescription='Viết và xuất bản bài viết.'
    >
      <BlogFormPage />
    </PageContainer>
  );
}
