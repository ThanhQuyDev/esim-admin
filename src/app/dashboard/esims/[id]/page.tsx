import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { esimQueryOptions } from '@/features/esims/api/queries';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { EsimDetailView, EsimDetailSkeleton } from '@/features/esims/components/esim-detail-view';

export const metadata = {
  title: 'Dashboard: Chi tiết eSIM'
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EsimDetailPage(props: PageProps) {
  const { id } = await props.params;
  const esimId = Number(id);

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(esimQueryOptions(esimId));

  return (
    <PageContainer
      scrollable
      pageTitle='Chi tiết eSIM'
      pageDescription={`Thông tin chi tiết eSIM #${id}`}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<EsimDetailSkeleton />}>
          <EsimDetailView esimId={esimId} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
