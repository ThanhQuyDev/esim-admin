import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { Suspense } from 'react';
import { walletsQueryOptions } from '../api/queries';
import { buildWalletApiFilters } from '../utils/wallet-filters';
import { WalletsTable, WalletsTableSkeleton } from './wallets-table/index';

export default function WalletListingPage() {
  const sort = searchParamsCache.get('sort');

  // Built exactly as WalletsTable builds it, or the prefetched query is not the
  // one the table reads.
  const filters = buildWalletApiFilters({
    page: searchParamsCache.get('page'),
    limit: searchParamsCache.get('perPage'),
    name: searchParamsCache.get('name'),
    customerCode: searchParamsCache.get('customerCode'),
    customerName: searchParamsCache.get('customerName'),
    membershipTier: searchParamsCache.get('membershipTier'),
    ...(sort ? { sort } : {})
  });

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(walletsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<WalletsTableSkeleton />}>
        <WalletsTable />
      </Suspense>
    </HydrationBoundary>
  );
}
