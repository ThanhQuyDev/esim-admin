import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { manufacturerNoteQueryOptions } from '../api/queries';
import { buildManufacturerNoteFilters } from '../utils/manufacturer-note-filters';
import { ManufacturerNotesTable } from './manufacturer-notes-table';

export default function ManufacturerNoteListingPage() {
  const filters = buildManufacturerNoteFilters({
    page: searchParamsCache.get('page'),
    perPage: searchParamsCache.get('perPage'),
    name: searchParamsCache.get('name'),
    sort: parseSort(searchParamsCache.get('sort'))
  });

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(manufacturerNoteQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ManufacturerNotesTable />
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
