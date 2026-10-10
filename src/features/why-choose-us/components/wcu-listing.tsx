import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { wcuQueryOptions } from '../api/queries';
import { buildWcuApiFilters } from '../utils/wcu-filters';
import { WcuTable } from './wcu-table';

function toApiSort(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const state = JSON.parse(raw) as { id: string; desc: boolean }[];
    if (!Array.isArray(state) || state.length === 0) return undefined;
    return JSON.stringify(state.map((s) => ({ orderBy: s.id, order: s.desc ? 'DESC' : 'ASC' })));
  } catch {
    return undefined;
  }
}

export default function WcuListingPage() {
  // The same `[{orderBy, order}]` JSON the table sends; the raw URL value
  // (`[{"id":…,"desc":…}]`) made the prefetch a different query than the table's.
  const sort = toApiSort(searchParamsCache.get('sort'));
  // Built exactly as WcuTable builds it, or the prefetched query is not the one
  // the table reads.
  const filters = buildWcuApiFilters({
    page: searchParamsCache.get('page'),
    limit: searchParamsCache.get('perPage'),
    name: searchParamsCache.get('name'),
    type: searchParamsCache.get('type'),
    isActive: searchParamsCache.get('isActive'),
    ...(sort ? { sort } : {})
  });
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(wcuQueryOptions(filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WcuTable />
    </HydrationBoundary>
  );
}
