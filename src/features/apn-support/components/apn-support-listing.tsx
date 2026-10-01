import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { apnSupportQueryOptions } from '../api/queries';
import { buildApnSupportFilters } from '../utils/apn-support-filters';
import { ApnSupportTable } from './apn-support-table';

export default function ApnSupportListingPage() {
  const filters = buildApnSupportFilters({
    page: searchParamsCache.get('page'),
    perPage: searchParamsCache.get('perPage'),
    name: searchParamsCache.get('name'),
    sort: parseSort(searchParamsCache.get('sort'))
  });

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(apnSupportQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApnSupportTable />
    </HydrationBoundary>
  );
}

/**
 * The server cache keeps `sort` as the raw string; the client parses it with
 * `getSortingStateParser`. Both have to end up with the same shape or the
 * prefetched key will not match the one the table asks for.
 */
function parseSort(raw: string | null): { id: string; desc: boolean }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
