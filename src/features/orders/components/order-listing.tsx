import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { Suspense } from 'react';
import { ordersQueryOptions } from '../api/queries';
import { OrdersTable, OrdersTableSkeleton } from './orders-table/index';
import { invoiceFilterToApi } from '../utils/invoice-filter';

export default function OrderListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const invoice = searchParamsCache.get('invoice');

  const apiFilters: Record<string, unknown> = {};
  if (status) apiFilters.status = status;
  // Same key order as OrdersTable, so the prefetched query is the one it reads (#051).
  Object.assign(apiFilters, invoiceFilterToApi(invoice));

  const filters = {
    page,
    limit: pageLimit,
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
