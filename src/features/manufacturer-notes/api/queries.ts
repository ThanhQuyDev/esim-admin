import { queryOptions } from '@tanstack/react-query';
import { getManufacturerNotes } from './service';
import type { ManufacturerNote, ManufacturerNoteFilters } from './types';

export type { ManufacturerNote };

export const manufacturerNoteKeys = {
  all: ['manufacturer-notes'] as const,
  list: (filters: ManufacturerNoteFilters) =>
    [...manufacturerNoteKeys.all, 'list', filters] as const,
  detail: (id: string) => [...manufacturerNoteKeys.all, 'detail', id] as const
};

export const manufacturerNoteQueryOptions = (filters: ManufacturerNoteFilters) =>
  queryOptions({
    queryKey: manufacturerNoteKeys.list(filters),
    queryFn: () => getManufacturerNotes(filters)
  });
