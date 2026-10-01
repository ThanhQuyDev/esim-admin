import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { Suspense } from 'react';
import { ordersQueryOptions } from '../api/queries';
import { OrdersTable, OrdersTableSkeleton } from './orders-table/index';
import { buildOrderApiFilters } from '../utils/order-filters';

export default function OrderListingPage() {
  // One mapping shared with OrdersTable, so the prefetched query is the one it
  // reads — the two had drifted apart by four filters (#017).
  const apiFilters = buildOrderApiFilters({
    orderNumber: searchParamsCache.get('orderNumber'),
    userEmail: searchParamsCache.get('userEmail'),
    iccid: searchParamsCache.get('iccid'),
    planName: searchParamsCache.get('planName'),
    status: searchParamsCache.get('status'),
    invoice: searchParamsCache.get('invoice'),
    kind: searchParamsCache.get('kind'),
    createdFrom: searchParamsCache.get('createdFrom'),
    createdTo: searchParamsCache.get('createdTo')
  });

  const filters = {
    page: searchParamsCache.get('page'),
    limit: searchParamsCache.get('perPage'),
    ...(Object.keys(apiFilters).length > 0 && {
      filters: JSON.stringify(apiFilters)
    })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(ordersQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersTable />
      </Suspense>
    </HydrationBoundary>
  );
}
