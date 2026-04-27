'use client';

import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { EmailTemplateFormPage } from '@/features/email-templates/components/email-template-form-page';
import { Skeleton } from '@/components/ui/skeleton';

function EmailTemplateEditorSkeleton() {
  return (
    <div className='mx-auto w-full max-w-5xl space-y-6'>
      <Skeleton className='h-10 w-64' />
      <Skeleton className='h-48 w-full' />
      <Skeleton className='h-32 w-full' />
      <Skeleton className='h-96 w-full' />
    </div>
  );
}

export default function EmailTemplatesPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Email Template'
      pageDescription='Chỉnh sửa mẫu email gửi eSIM cho khách hàng.'
    >
      <Suspense fallback={<EmailTemplateEditorSkeleton />}>
        <EmailTemplateFormPage />
      </Suspense>
    </PageContainer>
  );
}
