import PageContainer from '@/components/layout/page-container';
import { BlogCategoriesView } from '@/features/blogs/components/blog-categories-view';

export const metadata = { title: 'Dashboard: Danh mục blog' };

export default function BlogCategoriesPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Danh mục blog'
      pageDescription='Danh mục và danh mục con tác giả chọn khi viết bài; thêm, đổi tên hoặc xoá.'
    >
      <BlogCategoriesView />
    </PageContainer>
  );
}
