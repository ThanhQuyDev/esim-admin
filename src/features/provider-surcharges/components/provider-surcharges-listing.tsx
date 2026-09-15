import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { providerSurchargesQueryOptions } from '../api/queries';
import { ProviderSurchargesTable } from './provider-surcharges-table';

export default function ProviderSurchargesListingPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(providerSurchargesQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProviderSurchargesTable />
    </HydrationBoundary>
  );
}
