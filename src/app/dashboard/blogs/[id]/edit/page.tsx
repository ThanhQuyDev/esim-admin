'use client';

import PageContainer from '@/components/layout/page-container';
import { BlogFormPage } from '@/features/blogs/components/blog-form-page';
import { useSuspenseQuery } from '@tanstack/react-query';
import { blogQueryOptions } from '@/features/blogs/api/queries';
import { useBreadcrumbOverrides } from '@/hooks/use-breadcrumb-context';
import { use, useEffect } from 'react';

interface EditBlogPageProps {
  params: Promise<{ id: string }>;
}

export default function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = use(params);
  const { data: blog } = useSuspenseQuery(blogQueryOptions(id));
  const { setOverride, clearOverride } = useBreadcrumbOverrides();

  useEffect(() => {
    if (blog?.title) {
      setOverride(id, blog.title);
    }
    return () => clearOverride(id);
  }, [id, blog?.title, setOverride, clearOverride]);

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
