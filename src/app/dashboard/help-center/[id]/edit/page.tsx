'use client';

import PageContainer from '@/components/layout/page-container';
import { HelpCenterFormPage } from '@/features/help-center/components/help-center-form-page';
import { useSuspenseQuery } from '@tanstack/react-query';
import { helpCenterArticleQueryOptions } from '@/features/help-center/api/queries';
import { use } from 'react';

interface EditHelpCenterPageProps {
  params: Promise<{ id: string }>;
}

export default function EditHelpCenterPage({ params }: EditHelpCenterPageProps) {
  const { id } = use(params);
  const { data: article } = useSuspenseQuery(helpCenterArticleQueryOptions(id));

  return (
    <PageContainer
      scrollable
      pageTitle='Chỉnh sửa bài viết'
      pageDescription='Cập nhật nội dung bài viết hỗ trợ.'
    >
      <HelpCenterFormPage article={article} />
    </PageContainer>
  );
}
