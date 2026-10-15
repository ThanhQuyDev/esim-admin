import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { orderQueryOptions } from '@/features/orders/api/queries';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import {
  OrderDetailView,
  OrderDetailSkeleton
} from '@/features/orders/components/order-detail-view';
import { OrderNumberRedirect } from '@/features/orders/components/order-number-redirect';

export const metadata = {
  title: 'Dashboard: Chi tiết đơn hàng'
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage(props: PageProps) {
  const { id } = await props.params;
  const orderId = Number(id);

  // Opened by its code from a ticket (doitac-1410 #023): find the id first.
  if (!Number.isInteger(orderId) || orderId <= 0) {
    const code = decodeURIComponent(id);
    return (
      <PageContainer scrollable pageTitle='Chi tiết đơn hàng' pageDescription={`Đơn ${code}`}>
        <OrderNumberRedirect orderNumber={code} />
      </PageContainer>
    );
  }

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
