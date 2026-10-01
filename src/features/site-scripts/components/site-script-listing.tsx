import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { siteScriptQueryOptions } from '../api/queries';
import { buildSiteScriptFilters } from '../utils/site-script-filters';
import { SiteScriptsTable } from './site-scripts-table';

export default function SiteScriptListingPage() {
  const filters = buildSiteScriptFilters({
    page: searchParamsCache.get('page'),
    perPage: searchParamsCache.get('perPage'),
    name: searchParamsCache.get('name'),
    sort: parseSort(searchParamsCache.get('sort'))
  });

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(siteScriptQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SiteScriptsTable />
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
