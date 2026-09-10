import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { providerDepositSummaryQueryOptions } from '../api/queries';
import { ProviderDepositsTable } from './provider-deposits-table';

export default function ProviderDepositsListingPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(providerDepositSummaryQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProviderDepositsTable />
    </HydrationBoundary>
  );
}
