import { apiClient } from '@/lib/api-client';
import type {
  CreateManufacturerNotePayload,
  ManufacturerNote,
  ManufacturerNoteFilters,
  ManufacturerNoteResponse,
  UpdateManufacturerNotePayload
} from './types';

export async function getManufacturerNotes(
  filters: ManufacturerNoteFilters
): Promise<ManufacturerNoteResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);
  const query = params.toString();
  return apiClient<ManufacturerNoteResponse>(`/manufacturer-notes${query ? `?${query}` : ''}`);
}

export async function createManufacturerNote(
  data: CreateManufacturerNotePayload
): Promise<ManufacturerNote> {
  return apiClient<ManufacturerNote>('/manufacturer-notes', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateManufacturerNote(
  id: string,
  data: UpdateManufacturerNotePayload
): Promise<ManufacturerNote> {
  return apiClient<ManufacturerNote>(`/manufacturer-notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteManufacturerNote(id: string): Promise<void> {
  await apiClient(`/manufacturer-notes/${id}`, { method: 'DELETE' });
}
