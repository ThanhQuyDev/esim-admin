import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { orderQueryOptions } from '@/features/orders/api/queries';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import {
  OrderDetailView,
  OrderDetailSkeleton
} from '@/features/orders/components/order-detail-view';

export const metadata = {
  title: 'Dashboard: Chi tiết đơn hàng'
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage(props: PageProps) {
  const { id } = await props.params;
  const orderId = Number(id);

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(orderQueryOptions(orderId));

  return (
    <PageContainer
      scrollable
      pageTitle='Chi tiết đơn hàng'
      pageDescription={`Thông tin chi tiết đơn hàng #${id}`}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<OrderDetailSkeleton />}>
          <OrderDetailView orderId={orderId} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
