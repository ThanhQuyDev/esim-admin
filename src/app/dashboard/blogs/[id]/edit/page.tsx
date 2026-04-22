'use client';

import PageContainer from '@/components/layout/page-container';
import { BlogFormPage } from '@/features/blogs/components/blog-form-page';
import { useSuspenseQuery } from '@tanstack/react-query';
import { blogQueryOptions } from '@/features/blogs/api/queries';
import { use } from 'react';

interface EditBlogPageProps {
  params: Promise<{ id: string }>;
}

export default function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = use(params);
  const { data: blog } = useSuspenseQuery(blogQueryOptions(Number(id)));

  return (
    <PageContainer
      scrollable
      pageTitle='Chỉnh sửa bài viết'
      pageDescription='Cập nhật nội dung bài viết.'
    >
      <BlogFormPage blog={blog} />
    </PageContainer>
  );
}
