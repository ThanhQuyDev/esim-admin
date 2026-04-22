import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { profitMarginQueryOptions } from '@/features/profit-margins/api/queries';
import { ProfitMarginForm } from '@/features/profit-margins/components/profit-margin-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Dashboard: Profit Margin'
};

export default function ProfitMarginPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(profitMarginQueryOptions());

  return (
    <PageContainer pageTitle='Profit Margin' pageDescription='Quản lý tỷ lệ lợi nhuận.'>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Skeleton className='h-64 w-full max-w-lg' />}>
          <ProfitMarginForm />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
