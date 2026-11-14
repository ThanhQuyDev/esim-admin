import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { providerSalesStatusesQueryOptions } from '../api/queries';
import { ProviderListTable } from './provider-list-table';

/** "Danh sách Nhà cung cấp" (vande-1411 #024). */
export default function ProviderListListingPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(providerSalesStatusesQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProviderListTable />
    </HydrationBoundary>
  );
}
