import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { providerSalesStatusesQueryOptions } from '../api/queries';
import { ProviderSalesStatusTable } from './provider-sales-status-table';
import { FullSyncButton } from './full-sync-button';

export default function ProviderSalesStatusListingPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(providerSalesStatusesQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='space-y-4'>
        {/* doitac-1410 #074 */}
        <FullSyncButton />
        <ProviderSalesStatusTable />
      </div>
    </HydrationBoundary>
  );
}
