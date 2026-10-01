import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { providerSalesStatusesQueryOptions } from '../api/queries';
import { ProviderSalesStatusTable } from './provider-sales-status-table';

export default function ProviderSalesStatusListingPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(providerSalesStatusesQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProviderSalesStatusTable />
    </HydrationBoundary>
  );
}
